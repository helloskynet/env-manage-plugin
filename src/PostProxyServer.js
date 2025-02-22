const express = require("express");
const path = require("path");

const { createProxyMiddleware } = require("http-proxy-middleware");
const ManageServer = require("./ManageServer");

class PostProxyMiddleware {
  constructor(port) {
    this.app = express();

    this.app.use(express.static(path.join(__dirname, "client")));

    this.app.use(this.createPostProxyMiddleware());

    this.app.use((err, req, res, next) => {
      if (err.message === "SKIP_PROXY") {
        // 跳过代理并继续执行下一个中间件
        return next();
      }

      // 其他错误处理
      res.status(500).send("代理服务器出错");
    });

    this.app.listen(port, () => {
      console.log(`Post Proxy Middleware is running on http://localhost:${port}`);
    });
  }

  createPostProxyMiddleware() {
    // 前置转发：将请求转发到 Webpack 开发服务器

    const envList = ManageServer.envList;

    return createProxyMiddleware({
      changeOrigin: true,
      ws: true,
      router: (req) => {
        if (req.headers["x-api-server"]) {
          const port = req.headers["x-api-server"];
          const env = envList.find((item) => item.port == port);
          if (env && env.target) {
            return env.target;
          }
        }
        // 抛出自定义错误
        throw new Error("SKIP_PROXY");
      },
    });
  }

  get getPostProxyMiddleware() {
    return this.postProxyMiddleware;
  }

  get getApp() {
    return this.app;
  }
}

module.exports = PostProxyMiddleware;
