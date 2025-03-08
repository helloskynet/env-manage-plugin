import { Server } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import WebSocket, { WebSocketServer } from "ws";
// 导入 express 模块
import express, {
  Application,
  Errback,
  Request,
  Response,
  NextFunction,
} from "express";
// 导入 express-static-gzip 模块
import expressStaticGzip from "express-static-gzip";
// 从 http-proxy-middleware 模块导入 createProxyMiddleware 函数
import { createProxyMiddleware } from "http-proxy-middleware";

// 导入本地的 Utils 模块
import Utils from "./Utils.js";
// 导入本地的 ManageRouter 模块
import ManageRouter from "./ManageRouter.js";
import { Config, EnvConfig } from "./Config.js";
import PreProxyServer from "./PreProxyServer.js";

/**
 * 后置代理服务器---同时也是管理页面的服务器
 */
class PostProxyServer {
  app: Application;
  config: Config;
  preProxyServer: PreProxyServer;

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

    const excludeRegex = new RegExp(`^(?!${this.config.envConfig.basePath}).*`);
    // 代理中间件
    app.use(excludeRegex, this.createPostProxyMiddleware());
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
    const wss = new WebSocketServer({ server });

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
        console.log("客户端已断开 WebSocket 连接");
      });
    });

    this.config.bus.on("message", (data) => {
      const message = JSON.stringify(data);
      this.wsClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  }

  createPostProxyMiddleware() {
    return createProxyMiddleware({
      changeOrigin: true,
      ws: true,
      router: (req) => {
        if (req.headers["x-api-server"]) {
          const port = req.headers["x-api-server"] as string;

          const envName = this.preProxyServer.appMap[`${port}`].x_name;

          const env = this.config.findEnvByNameAndPort(envName, port);

          if (env?.router) {
            return env.router(req, env);
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
