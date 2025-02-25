const ManageServer = require("./ManageServer");
const { createProxyMiddleware } = require("http-proxy-middleware");
const express = require("express");

class PreProxyServer {
  constructor() {
    this.app = express();
    this.app.use(this.createPreProxyMiddleware());
  }

  createPreProxyMiddleware() {
    // 前置转发：将请求转发到 Webpack 开发服务器
    return createProxyMiddleware({
      changeOrigin: true,
      ws: true,
      router: (req) => {
        const env = ManageServer.findRunningEnv(req.socket.localPort);

        const target = ManageServer.findSelectedDevServer(env.devServerName);

        // 默认转发到 Webpack 开发服务器
        return target.target;
      },
      on: {
        proxyReq(proxyReq, req, res) {
          if (!req.path.includes("dev-manage-api")) {
            proxyReq.setHeader("X-API-Server", `${req.socket.localPort}`);
          }
        },
      },
    });
  }

  get getApp() {
    return this.app;
  }
}

module.exports = PreProxyServer;
