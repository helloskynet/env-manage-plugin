import { Socket } from "net";
import { ClientRequest, IncomingMessage, Server } from "http";
import express, { Application, Request } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import setCookieParser, { Cookie } from "set-cookie-parser";
import * as libCookie from "cookie";

import Utils from "./Utils.js";
import { APP_STATUS, EnvItem, KeyObj } from "./types.js";
import { Config, FILE_CHANGE_EVENT } from "./Config.js";

class PreProxyServer {
  app: Application;

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

  static config = new Config();

  static {
    this.config.bus.on(FILE_CHANGE_EVENT, () => {
      this.updateAppMapAfterConfigFileChange();
    });
  }

  static create(envConfig: EnvItem) {
    const { port } = envConfig;
    if (this.appMap[port]) {
      console.log(`端口 ${port} 已经启动`);
      return null;
    }

    return new PreProxyServer(envConfig);
  }

  private constructor(envConfig: EnvItem) {
    this.app = express();
    this.envKey = Utils.getRowKey(envConfig);
    this.app.use(this.createPreProxyMiddleware());
    this.startServer(envConfig);
  }

  getEnvItem() {
    const envItem = PreProxyServer.config.envMap.get(this.envKey);
    return envItem;
  }

  /**
   * 当前 代理的 cookie 前缀
   */
  get cookiePrefix() {
    const envItem = PreProxyServer.config.envMap.get(this.envKey);
    return `${PreProxyServer.configCookiePrefix}-${envItem.port}-`;
  }

  /**
   * 配置的 cookie 前缀
   */
  static get configCookiePrefix() {
    return `${PreProxyServer.config.envConfig.cookiePrefix}`;
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
      router: (req) => {
        const envItem = PreProxyServer.config.envMap.get(this.envKey);

        const devServerKey = Utils.getRowKey({
          name: envItem.devServerName,
        });

        const devServerConfig =
          PreProxyServer.config.devServerMap.get(devServerKey);
        // 默认转发到 Webpack 开发服务器
        return devServerConfig?.target;
      },
      on: {
        proxyReq: (proxyReq, req) => {
          proxyReq.setHeader("X-API-Server", `${req.socket.localPort}`);
          this._rewrieCookieOnProxyReq(proxyReq, req);
        },
        proxyRes: (proxyRes, req, res) => {
          this._rewriteSetCookieOnProxyRes(proxyRes);
        },
        proxyReqWs(proxyReq, req: Request, res) {
          proxyReq.setHeader("X-API-Server", `${req.socket.localPort}`);
        },
      },
    });
  }

  /**
   * 代理的时候如果收到了 setcookie 请求，则追加对应的代理cookie
   * @param proxyRes
   */
  private _rewriteSetCookieOnProxyRes(proxyRes: IncomingMessage) {
    const envItem = this.getEnvItem();
    const setCookie = proxyRes.headers["set-cookie"];
    if (envItem.isEnableCookieProxy && setCookie) {
      const cookie = setCookieParser.parse(setCookie);

      const proxyCookie = cookie.map((item: Cookie) => {
        const cookie = {
          ...item,
          name: `${this.cookiePrefix}${item.name}`,
        };
        return libCookie.serialize(
          cookie.name,
          cookie.value,
          cookie as libCookie.SerializeOptions
        );
      });

      setCookie.push(...proxyCookie);
      proxyRes.headers["set-cookie"] = setCookie;
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

    if (envItem.isEnableCookieProxy && req.headers.cookie) {
      const cookie = libCookie.parse(req.headers.cookie);
      
      const newCookies: string[] = [];

      Object.keys(cookie).forEach((item) => {
        if (item.startsWith(PreProxyServer.configCookiePrefix)) {
          return;
        }
        let cookieName = `${this.cookiePrefix}${item}`;
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
   * @param envConfig
   * @returns
   */
  startServer(envConfig: EnvItem) {
    const { port, name } = envConfig;
    if (PreProxyServer.appMap[port]) {
      console.log(`端口 ${port} 已经启动`);
      return;
    }

    this.server = this.app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      PreProxyServer.config.envMap.get(this.envKey).status = APP_STATUS.RUNNING;
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

    PreProxyServer.appMap[port] = this;
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
        const rowKey = this.appMap[port].envKey;
        PreProxyServer.config.envMap.get(rowKey).status = APP_STATUS.STOP;

        delete this.appMap[port];
        console.log(`Server on port ${port} 已关闭`, err || "");
        resolve(1);
      });
    });
  }

  /**
   * 配置文件变更 检查再配置中已经不存在的环境，并关闭改环境
   * @param newConfig
   */
  static updateAppMapAfterConfigFileChange() {
    const envMap = PreProxyServer.config.envMap;

    Object.entries(PreProxyServer.appMap).forEach(([port, item]) => {
      const rowKey = item.envKey;
      if (!envMap.has(rowKey)) {
        PreProxyServer.stopServer(port);
      }
    });
  }
}

export default PreProxyServer;
