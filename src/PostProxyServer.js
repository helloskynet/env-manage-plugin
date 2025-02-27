const express = require("express");
const path = require("path");

const { createProxyMiddleware } = require("http-proxy-middleware");
const ManageServer = require("./ManageServer");
const expressStaticGzip = require("express-static-gzip");

class PostProxyServer {
  constructor(envConfig) {
    this.envConfig = envConfig;
    this.port = envConfig.port;

    this.app = express();

    // 挂载管理页面的静态路由
    this.app.use(
      this.envConfig.basePath,
      expressStaticGzip(path.join(__dirname, "client"))
    );

    // 挂载代理中间件
    this.app.use(this.createPostProxyMiddleware());

    // 错误处理
    this.app.use((err, req, res, next) => {
      if (err.message === "SKIP_PROXY") {
        // 跳过代理并继续执行下一个中间件
        return next();
      }

      // 其他错误处理
      res.status(500).send("代理服务器出错");
    });

    // 启动服务
    this.startServer();
  }

  /**
   * 创建后置代理中间件
   * @returns {import("http-proxy-middleware").RequestHandler}
   */
  createPostProxyMiddleware() {
    // 后置转发：将接收到请求转发到对应的 API 服务器

    return createProxyMiddleware({
      changeOrigin: true,
      ws: true,
      router: (req) => {
        if (req.headers["x-api-server"]) {
          const port = req.headers["x-api-server"];

          const env = ManageServer.findRunningEnv(port);

          if (env?.router) {
            return env.router(req, env);
          }

          if (env?.target) {
            return env.target;
          }
        }
        // 抛出自定义错误
        throw new Error("SKIP_PROXY");
      },
    });
  }

  /**
   * 启动服务
   */
  startServer() {
    this.app.listen(this.port, () => {
      console.log(
        `Post Proxy Middleware is running on http://localhost:${this.port}`
      );
    });
  }

  get getApp() {
    return this.app;
  }
}

module.exports = PostProxyServer;
