const PostProxyServer = require("./PostProxyServer");
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
        const env = PostProxyServer.findRunningEnv(req.socket.localPort);

        const target = PostProxyServer.findSelectedDevServer(env.devServerName);

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

  appMap = {};

  startServer2(port, name) {
    if (this.appMap[port]) {
      console.log(`端口 ${port} 已经启动`);
      return;
    }

    const server = this.app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

    server.x_name = name;

    // 保存所有活动的 socket 连接
    server.x_sockets = new Set();

    server.on("connection", (socket) => {
      server.x_sockets.add(socket); // 保存 socket

      socket.setTimeout(300000); // 设置超时时间为 5 分钟

      socket.on("timeout", () => {
        socket.destroy();
        server.x_sockets.delete(socket);
      });

      // 监听 socket 关闭事件
      socket.on("close", () => {
        server.x_sockets.delete(socket); // 从集合中移除已关闭的 socket
      });
    });

    this.appMap[port] = server;
  }

  stopServer(port) {
    return new Promise((resolve, reject) => {
      if (!this.appMap[port]) {
        console.log(`端口 ${port} 未启动`);
        reject(`端口 【${port}】 未启动`);
        return;
      }

      this.appMap[port].close((err) => {
        console.log(`Server on port ${port} 已关闭`, err || "");
        delete this.appMap[port];
        resolve();
      });

      this.appMap[port].getConnections((err, count) => {
        if (err) {
          console.error("Error getting connections:", err);
        } else {
          console.log(`Active connections: ${count}`);
        }
        if (count > 0) {
          // 强制关闭所有活动的连接
          for (const socket of this.appMap[port].x_sockets) {
            socket.destroy(); // 强制关闭连接
          }
          console.log("Connection destroyed");
        }
      });
    });
  }
}

module.exports = PreProxyServer;
