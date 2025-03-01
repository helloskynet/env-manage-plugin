const { createProxyMiddleware } = require("http-proxy-middleware");
const express = require("express");
const Utils = require("./Utils");

class PreProxyServer {
  _envConfig = {};

  set envConfig(newConfig) {
    this.updateXenvOnApp(newConfig);
    this._envConfig = newConfig;
  }
  get envConfig() {
    return this._envConfig;
  }
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
        const devServerName =
          this.appMap[req.socket.localPort]?.x_env?.devServerName;

        const devServerConfig = this.findDevServerByName(devServerName);

        // 默认转发到 Webpack 开发服务器
        return devServerConfig.target;
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

  appMap = {};

  findDevServerByName(name) {
    return this.envConfig.devServerList.find((item) => item.name === name);
  }

  updateXenvOnApp(newConfig) {
    let envMapWithNamAndPort = Utils.generateMap(newConfig.envList);
    Object.values(this.appMap).forEach((item) => {
      const envItem = item.x_env;
      const rowKey = `${envItem.name}+${envItem.port}`;
      if (envMapWithNamAndPort[rowKey]) {
        envItem.x_env = envMapWithNamAndPort[rowKey];
      } else {
        this.stopServer(envItem.port);
      }
    });
  }

  startServer(envConfig) {
    const { port } = envConfig;
    if (this.appMap[port]) {
      console.log(`端口 ${port} 已经启动`);
      return;
    }

    const server = this.app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

    server.x_env = envConfig;

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

        this.appMap[port].close((err) => {
          this.appMap[port].x_sockets.forEach((socket) => {
            socket.removeAllListeners();
          });

          console.log(`Server on port ${port} 已关闭`, err || "");
          delete this.appMap[port];
          resolve();
        });
      });
    });
  }
}

module.exports = PreProxyServer;
