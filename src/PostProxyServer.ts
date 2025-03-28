import { Server } from "http";
import { join } from "path";
import WebSocket, { WebSocketServer } from "ws";
import express, {
  Application,
  Errback,
  Request,
  Response,
  NextFunction,
} from "express";
import expressStaticGzip from "express-static-gzip";
import { createProxyMiddleware } from "http-proxy-middleware";

import ManageRouter from "./ManageRouter.js";
import PreProxyServer from "./PreProxyServer.js";
import { Config, FILE_CHANGE_EVENT } from "./Config.js";

/**
 * 后置代理服务器---同时也是管理页面的服务器
 */
class PostProxyServer {
  app: Application;
  config: Config;

  constructor() {
    this.config = new Config();

    // 初始化服务器
    this.app = this.initializeServer();

    // 初始化管理路由
    const manageRouter = new ManageRouter();
    this.app.use(this.config.envmConfig.basePath, manageRouter.getRouter());

    // 全局错误处理中间件
    this.app.use(
      (err: Errback, req: Request, res: Response, next: NextFunction) => {
        console.error("未捕获的错误:", err);
        res.status(500).send("服务器内部错误");
      }
    );

    // 启动服务器
    const server = this.startServer();

    this.registerWs(server);
  }

  initializeServer() {
    const app = express();

    // 代理中间件
    app.use(this.createPostProxyMiddleware());
    // 无需代理的数据继续下一个中间件
    app.use(this.errorHandler);

    // 静态资源
    app.use(expressStaticGzip(join(__dirname, "client"), {}));

    return app;
  }

  /**
   * 注册ws服务用于通知客户端更新
   * @param server
   */
  registerWs(server: Server) {
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      if (request.url.startsWith(this.config.envmConfig.basePath)) {
        wss.handleUpgrade(request, socket, head, (ws) => {});
      }
    });

    this.config.bus.on(FILE_CHANGE_EVENT, (data) => {
      const message = JSON.stringify(data);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  }

  /**
   * 创建后置服务器 代理转发中间件
   * @returns
   */
  createPostProxyMiddleware() {
    // 定义路径过滤函数，排除 管理url
    const pathFilter = (path: string, req: Request) => {
      return !!req.headers["x-api-server"];
    };
    return createProxyMiddleware({
      pathFilter,
      ws: true,
      changeOrigin: true,
      router: async (req) => {
        if (req.headers["x-api-server"]) {
          const port = req.headers["x-api-server"] as string;

          const envKey = PreProxyServer.appMap[`${port}`].envKey;

          const env = this.config.envMap.get(envKey);

          if (env?.router) {
            return await env.router(req, env);
          }
          if (env?.target) {
            return env.target;
          }
          return env?.target;
        }
        throw new Error("SKIP_PROXY");
      },
    });
  }

  errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err.message === "SKIP_PROXY") {
      return next();
    }
    res.status(500).send("代理服务器出错");
  }

  /**
   * 启动服务
   */
  startServer() {
    return this.app.listen(this.config.envmConfig.port, () => {
      console.log(
        `Post Proxy Middleware is running on http://localhost:${this.config.envmConfig.port}`
      );
    });
  }
}

export default PostProxyServer;
