import { Socket } from "net";
import { ClientRequest, IncomingMessage, Server } from "http";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import setCookieParser, { Cookie } from "set-cookie-parser";
import * as libCookie from "cookie";

import { config } from "../ResolveConfig.js";
import { EnvRepo } from "../repositories/EnvRepo.js";
import { DevServerRepo } from "../repositories/DevServerRepo.js";
import { EnvModel } from "@envm/schemas";

class PreProxyServer {
  /**
   * 代理服务器
   */
  server!: Server;

  /**
   * 保存当前代理的 socket 连接 关闭前先 断开所有链接
   */
  sockets!: Set<Socket>;

  /**
   * 判断该端口是否已经有服务存在
   * @param port
   * @returns
   */
  static getAppInsByPort(port: string) {
    return this.appMap[port];
  }

  /**
   * 保存启动的环境实例
   */
  private static appMap: {
    [key: string]: PreProxyServer;
  } = {};

  static async create(
    envId: string,
    envRepo: EnvRepo,
    devServerRepo: DevServerRepo
  ) {
    if (this.appMap[envId]) {
      console.log(`环境 ${envId} 已经启动`);
      return null;
    }

    const preProxyServer = new PreProxyServer(envId, envRepo, devServerRepo);
    await preProxyServer.startServer();
    PreProxyServer.appMap[envId] = preProxyServer;
    return preProxyServer;
  }

  private constructor(
    private envId: string,
    private envRepo: EnvRepo,
    private devServerRepo: DevServerRepo,
    private app = express()
  ) {
    app.use(this.createPreProxyMiddleware());
  }

  /**
   *
   * @returns 获取绑定的环境信息
   */
  getEnvItem() {
    const envItem = this.envRepo.findOneById(this.envId);
    return envItem as EnvModel;
  }

  /**
   * 获取绑定的服务器详情
   */
  getDevServer() {}

  /**
   * 当前 代理的 cookie 后缀
   */
  get cookieSuffix() {
    const envItem = this.getEnvItem();
    return `-${envItem?.port}-${PreProxyServer.configCookieSuffix}`;
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
        // 查询环境信息
        const envItem = this.getEnvItem();
        // 根据环境信息查询绑定的服务，地址
        const devServerConfig = this.devServerRepo.findOneById({
          id: envItem?.devServerId ?? "",
        });
        // 默认转发到 Webpack 开发服务器
        return `${devServerConfig?.devServerUrl}`;
      },
      on: {
        proxyReq: (proxyReq, req) => {
          const envItem = this.getEnvItem();
          const target = `${envItem?.apiBaseUrl}`;
          proxyReq.setHeader("X-API-Server", `${target}`);
          this._rewrieCookieOnProxyReq(proxyReq, req);
        },
        proxyRes: (proxyRes) => {
          this._rewriteSetCookieOnProxyRes(proxyRes);
        },
        proxyReqWs: (proxyReq) => {
          const envItem = this.getEnvItem();
          const target = `${envItem?.apiBaseUrl}`;
          proxyReq.setHeader("X-API-Server", `${target}`);
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

      setCookie.push(...proxyCookie);
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
        newCookies.push(libCookie.serialize(item, cookie[cookieName] || ""));
      });

      proxyReq.setHeader("cookie", newCookies.join(";"));
    }
  }

  /**
   * 启动服务
   * @param envItem
   * @returns
   */
  async startServer() {
    const { port } = this.getEnvItem();
    if (PreProxyServer.appMap[this.envId]) {
      console.log(`环境 ${this.envId} 已经启动`);
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
    return new Promise((resolve) => {
      if (!this.getAppInsByPort(port as string)) {
        console.log(`端口 ${port} 未启动，无需停止！`);
        resolve(1);
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
