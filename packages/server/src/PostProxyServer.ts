import { Server } from "http";
import { join } from "path";
import { WebSocketServer } from "ws";
import express, { Errback, NextFunction, Request, Response } from "express";
import expressStaticGzip from "express-static-gzip";
import { createProxyMiddleware } from "http-proxy-middleware";
import PreProxyServer from "./PreProxyServer.js";
import { config } from "./ResolveConfig.js";
import { createRouter } from "./routes/index.js";

// ApiResponse工具函数
const ApiResponse = {
  success: (data: unknown) => ({ code: 200, message: "success", data }),
  error: (code: unknown, message: unknown) => ({ code, message }),
};

/**
 * 后置代理服务器---同时也是管理页面的服务器
 */
class PostProxyServer {
  constructor(private app = express()) {
    // 代理中间件
    app.use(this.createPostProxyMiddleware());

    // 静态资源
    app.use(expressStaticGzip(join(__dirname, "client"), {}));

    // Express中间件（统一处理响应）
    app.use((req, res, next) => {
      // 保存原始res.json方法
      const originalJson = res.json;
      // 重写res.json，自动封装为ApiResponse
      res.json = function (body) {
        // 如果已经是ApiResponse格式，则直接返回
        if (body && body.code !== undefined) {
          return originalJson.call(this, body);
        }
        // 正常响应：封装为success格式
        return originalJson.call(this, ApiResponse.success(body));
      };
      next();
    });
    // 初始化管理路由
    app.use(config.apiPrefix, createRouter());

    // 全局错误处理中间件
    app.use(this.globalErrorHandler);

    // 启动服务器
    const server = this.startServer();

    this.registerWs(server);
  }

  private globalErrorHandler = (
    err: Errback,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.error("未捕获的错误:", err);

    // 2. 检查响应是否已发送
    if (res.headersSent) {
      return next(err);
    }

    // 3. 安全地发送错误响应
    res.status(500).send("服务器内部错误");
  };

  /**
   * 启动服务
   */
  private startServer() {
    return this.app.listen(config.port, () => {
      console.log(
        `Post Proxy Middleware is running on http://localhost:${config.port}`
      );
    });
  }

  /**
   * 注册ws服务用于通知客户端更新
   * @param server
   */
  private registerWs(server: Server) {
    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      if (request?.url?.startsWith(config.apiPrefix)) {
        wss.handleUpgrade(request, socket, head, () => {});
      }
    });
  }

  /**
   * 创建后置服务器 代理转发中间件
   * @returns
   */
  private createPostProxyMiddleware() {
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

          const env = PreProxyServer.portToEnvMap[`${port}`];

          if (env?.devServerId) {
            return env.devServerId;
          }
          return env?.devServerId;
        }
      },
    });
  }
}

export default PostProxyServer;
