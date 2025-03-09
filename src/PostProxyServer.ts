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

import Utils from "./Utils.js";
import ManageRouter from "./ManageRouter.js";
import PreProxyServer from "./PreProxyServer.js";
import { Config, EnvConfig, FILE_CHANGE_EVENT } from "./Config.js";

/**
 * 后置代理服务器---同时也是管理页面的服务器
 */
class PostProxyServer {
  app: Application;
  config: Config;
  preProxyServer: PreProxyServer;

  postMiddware: RequestHandler;
  wsClients: Set<WebSocket> = new Set();

  constructor(preProxyServer: PreProxyServer) {
    this.config = new Config();
    this.preProxyServer = preProxyServer;

    // 初始化服务器
    this.app = this.initializeServer();

    // 初始化管理路由
    const manageRouter = new ManageRouter(preProxyServer);
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
    // 拦截指定 URL 的 WebSocket 请求
    const handleSpecificWs = (
      request: IncomingMessage,
      socket: Stream.Duplex,
      head: Buffer<ArrayBufferLike>
    ) => {
      if (request.url.startsWith(this.config.envConfig.basePath)) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
          // ws.on("message", (message) => {
          //   ws.send(`Server received on /specific-url: ${message}`);
          // });
          // ws.on("close", () => {
          //   console.log("Client disconnected from /specific-url WebSocket.");
          // });
        });
        return true;
      }
      return false;
    };

    server.on("upgrade", (request, socket, head) => {
      if (!handleSpecificWs(request, socket, head)) {
        // 如果不是指定 URL，交给代理中间件处理
        this.postMiddware.upgrade(request, socket as Socket, head);
      }
    });

    wss.on("connection", (ws) => {
      this.wsClients.add(ws);

      // 处理客户端发送的消息
      ws.on("message", (message) => {
        console.log(`接收到 WebSocket 消息: ${message}`);
        // 向客户端发送响应消息
        ws.send(`服务器已收到 WebSocket 消息: ${message}`);
      });

      // 处理客户端断开连接
      ws.on("close", () => {
        this.wsClients.delete(ws);
      });
    });

    this.config.bus.on(FILE_CHANGE_EVENT, (data) => {
      const message = JSON.stringify(data);
      this.wsClients.forEach((client) => {
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
      changeOrigin: true,
      ws: true,
      router: async (req) => {
        if (req.headers["x-api-server"]) {
          const port = req.headers["x-api-server"] as string;

          const envName = this.preProxyServer.appMap[`${port}`].x_name;

          const env = this.config.findEnvByNameAndPort(envName, port);

          if (env?.router) {
            return await env.router(req, env);
          }
          if (env?.target) {
            return env.target;
          }
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

  udpateEnvList(newConfig: EnvConfig) {
    const { envList: newEnvList, indexPage, devServerList } = newConfig;
    const { envList: oldEnvList = [] } = this.config.envConfig;

    const newListAfter = Utils.removeEnvDuplicates(newEnvList);

    const oldEnvMap = Utils.generateMap(oldEnvList); // 生成端口号到环境配置的映射

    const devServerMap = Utils.generateMap(devServerList, ["name"]);

    const defautlDevserverName = devServerList[0]?.name ?? "";

    // 返回新的环境配置
    const newList = newListAfter.map((item) => {
      const rowKey = Utils.getRowKey(item);

      let devServerName =
        oldEnvMap?.[rowKey]?.devServerName || item.devServerName;

      if (!devServerMap[devServerName]) {
        devServerName = defautlDevserverName;
      }

      return {
        ...item,
        indexPage: `${item.indexPage || indexPage || ""}`,
        devServerName,
      };
    });

    return newList;
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
