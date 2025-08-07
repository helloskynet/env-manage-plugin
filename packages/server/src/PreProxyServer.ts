import { Socket } from "net";
import { ClientRequest, IncomingMessage, Server } from "http";
import express, { Request } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import setCookieParser, { Cookie } from "set-cookie-parser";
import * as libCookie from "cookie";

import Utils from "./Utils.js";
import { config } from "./ResolveConfig.js";
import { EnvItemModel } from "./models/EnvModel.js";

class PreProxyServer {
  /**
   * 保存cookie
   * 因为同主机的不同端口会共享 cookie
   * 所以如果在同一个主机的不同端口，登录同一个应用的不同的环境会导致 cookie 被覆盖
   */
  cookie: string;

  /**
   * 代理服务器
   */
  server: Server;

  /**
   * 保存当前代理的 socket 连接 关闭前先 断开所有链接
   */
  sockets: Set<Socket>;

  /**
   * 绑定的环境信息
   */
  envKey: string;

  /**
   * 保存启动的环境实例
   */
  static appMap: {
    [key: string]: PreProxyServer;
  } = {};

  static portToEnvMap: {
    [key: string]: EnvItemModel;
  } = {};

  // fixme: 这里的 devServerMap 是为了存储开发服务器的配置
  // 目前是为了在代理请求时能够根据环境的 devServerName 获取对应的目标地址
  // 可能需要进一步优化，或者改为从配置文件中读取
  static devServerMap: {
    [key: string]: EnvItemModel;
  } = {};

  static async create(envmConfig: EnvItemModel) {
    const { port } = envmConfig;
    if (this.appMap[port]) {
      console.log(`端口 ${port} 已经启动`);
      return null;
    }

    this.portToEnvMap[envmConfig.port] = envmConfig;

    const preProxyServer = new PreProxyServer(envmConfig);
    await preProxyServer.startServer(envmConfig);
    PreProxyServer.appMap[port] = preProxyServer;
    return preProxyServer;
  }

  private constructor(
    envmConfig: EnvItemModel,
    private app = express()
  ) {
    this.envKey = Utils.getRowKey(envmConfig);
    app.use(this.createPreProxyMiddleware());
  }

  getEnvItem() {
    const envItem = PreProxyServer.portToEnvMap[this.envKey];
    return envItem;
  }

  /**
   * 当前 代理的 cookie 后缀
   */
  get cookieSuffix() {
    const envItem = PreProxyServer.portToEnvMap[this.envKey];
    return `-${envItem.port}-${PreProxyServer.configCookieSuffix}`;
  }

  /**
   * 配置的 cookie 后缀
   */
  static get configCookieSuffix() {
    return `${config.cookieSuffix}`;
  }

  /**
   * 生成代理中间件
   * @returns
   */
  createPreProxyMiddleware() {
    // 前置转发：将请求转发到 Webpack 开发服务器
    return createProxyMiddleware({
      ws: true,
      changeOrigin: true,
      router: () => {
        const envItem = PreProxyServer.portToEnvMap[this.envKey];

        const devServerKey = Utils.getRowKey({
          name: envItem.devServerId,
        });

        const devServerConfig = PreProxyServer.devServerMap[devServerKey];
        // 默认转发到 Webpack 开发服务器
        return devServerConfig?.devServerId;
      },
      on: {
        proxyReq: (proxyReq, req) => {
          proxyReq.setHeader("X-API-Server", `${req.socket.localPort}`);
          this._rewrieCookieOnProxyReq(proxyReq, req);
        },
        proxyRes: (proxyRes) => {
          this._rewriteSetCookieOnProxyRes(proxyRes);
        },
        proxyReqWs(proxyReq, req: Request) {
          proxyReq.setHeader("X-API-Server", `${req.socket.localPort}`);
        },
      },
    });
  }

  /**
   * 代理的时候如果收到了 setcookie 请求
   * 给 每一个 setcookie 追加保存一个 代理cookie
   * @param proxyRes
   */
  private _rewriteSetCookieOnProxyRes(proxyRes: IncomingMessage) {
    const envItem = this.getEnvItem();
    const setCookie = proxyRes.headers["set-cookie"];
    if (envItem && setCookie) {
      const setCookies = setCookieParser.parse(setCookie);

      const proxyCookie = setCookies.map((item: Cookie) => {
        const cookie = {
          ...item,
          name: `${item.name}${this.cookieSuffix}`,
        };
        return libCookie.serialize(
          cookie.name,
          cookie.value,
          cookie as libCookie.SerializeOptions
        );
      });

      proxyRes.headers["set-cookie"].push(...proxyCookie);
    }
  }

  /**
   * 代理 转发的时候，将对应端口的cookie 重写回去
   */
  private _rewrieCookieOnProxyReq(
    proxyReq: ClientRequest,
    req: IncomingMessage
  ) {
    const envItem = this.getEnvItem();

    if (envItem && req.headers.cookie) {
      const cookie = libCookie.parse(req.headers.cookie || "");

      const newCookies: string[] = [];

      Object.keys(cookie).forEach((item) => {
        if (item.endsWith(PreProxyServer.configCookieSuffix)) {
          return;
        }
        let cookieName = `${item}${this.cookieSuffix}`;
        if (!cookie[cookieName]) {
          cookieName = item;
        }
        newCookies.push(libCookie.serialize(item, cookie[cookieName]));
      });

      proxyReq.setHeader("cookie", newCookies.join(";"));
    }
  }

  /**
   * 启动服务
   * @param envmConfig
   * @returns
   */
  async startServer(envmConfig: EnvItemModel) {
    const { port } = envmConfig;
    if (PreProxyServer.appMap[port]) {
      console.log(`端口 ${port} 已经启动`);
      return;
    }

    this.server = await new Promise((resolve, reject) => {
      const server = this.app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
        // 更新状态
        resolve(server);
      });
      server.on("error", (err) => {
        console.error(`端口 ${port} 启动失败:`, err.message);
        reject(err);
      });
    });

    // 保存所有活动的 socket 连接
    this.sockets = new Set();

    this.server.on("connection", (socket) => {
      this.sockets.add(socket); // 保存 socket

      socket.setTimeout(300000); // 设置超时时间为 5 分钟

      socket.on("timeout", () => {
        socket.destroy();
        this.sockets.delete(socket);
      });

      // 监听 socket 关闭事件
      socket.on("close", () => {
        this.sockets.delete(socket); // 从集合中移除已关闭的 socket
      });
    });
  }

  static stopServer(port: number | string) {
    return new Promise((resolve, reject) => {
      if (!this.appMap[port]) {
        console.log(`端口 ${port} 未启动`);
        reject(`端口 【${port}】 未启动`);
        return;
      }

      for (const socket of this.appMap[port].sockets) {
        socket.destroy();
      }

      this.appMap[port].server.close((err) => {
        // 停止服务更新状态
        delete this.appMap[port];
        console.log(`Server on port ${port} 已关闭`, err || "");
        resolve(1);
      });
    });
  }
}

export default PreProxyServer;
