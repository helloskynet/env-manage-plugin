import Stream from "stream";
import { Socket } from "net";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { IncomingMessage, Server } from "http";
import WebSocket, { WebSocketServer } from "ws";
import express, {
  Application,
  Errback,
  Request,
  Response,
  NextFunction,
} from "express";
import expressStaticGzip from "express-static-gzip";
import { createProxyMiddleware, RequestHandler } from "http-proxy-middleware";

import ManageRouter from "./ManageRouter.js";
import PreProxyServer from "./PreProxyServer.js";
import { Config, FILE_CHANGE_EVENT } from "./Config.js";

/**
 * 后置代理服务器---同时也是管理页面的服务器
 */
class PostProxyServer {
  app: Application;
  config: Config;

  postMiddware: RequestHandler;

  constructor() {
    this.config = new Config();

    // 初始化服务器
    this.app = this.initializeServer();

    // 初始化管理路由
    const manageRouter = new ManageRouter();
    this.app.use(this.config.envConfig.basePath, manageRouter.getRouter());

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
    this.postMiddware = this.createPostProxyMiddleware();
    app.use(this.postMiddware);
    // 无需代理的数据继续下一个中间件
    app.use(this.errorHandler);

    // 静态资源
    // 获取当前模块的目录路径
    const __dirname = dirname(fileURLToPath(import.meta.url));

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
      if (request.url.startsWith(this.config.envConfig.basePath)) {
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

          const envName = PreProxyServer.appMap[`${port}`].x_name;

          const env = this.config.findEnvByNameAndPort(envName, port);

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
    return this.app.listen(this.config.envConfig.port, () => {
      console.log(
        `Post Proxy Middleware is running on http://localhost:${this.config.envConfig.port}`
      );
    });
  }
}

export default PostProxyServer;
