// 从 http-proxy-middleware 模块中导入 createProxyMiddleware 函数
import { createProxyMiddleware } from "http-proxy-middleware";
// 导入 express 模块
import express, { Application, Request } from "express";
import { Server } from "http";
import { Socket } from "net";
// 导入本地的 Utils 模块
import Utils from "./Utils";
import { Config } from "./Config";
import { EnvConfig, EnvItem } from ".";

type MyApplication = Server & {
  x_env: EnvItem;
  x_sockets: Set<Socket>;
};

class PreProxyServer {
  app: Application;

  appMap: {
    [key: string]: MyApplication;
  };

  config: Config;

  constructor() {
    this.appMap = {};
    this.config = new Config();
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
          this.appMap[`${req.socket.localPort}`]?.x_env?.devServerName;

        const devServerConfig = this.config.findDevServerByName(devServerName);

        // 默认转发到 Webpack 开发服务器
        return devServerConfig.target;
      },
      on: {
        proxyReq(proxyReq, req: Request, res) {
          if (!req.path.includes("dev-manage-api")) {
            proxyReq.setHeader("X-API-Server", `${req.socket.localPort}`);
          }
        },
      },
    });
  }

  updateXenvOnApp(newConfig: EnvConfig) {
    let envMapWithNamAndPort = Utils.generateMap(newConfig.envList);
    Object.values(this.appMap).forEach((item) => {
      const envItem = item.x_env;
      const rowKey = `${envItem.name}+${envItem.port}`;
      if (envMapWithNamAndPort[rowKey]) {
        item.x_env = envMapWithNamAndPort[rowKey];
      } else {
        this.stopServer(envItem.port);
      }
    });
  }

  startServer(envConfig: EnvItem) {
    const { port } = envConfig;
    if (this.appMap[port]) {
      console.log(`端口 ${port} 已经启动`);
      return;
    }

    const server = this.app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    }) as MyApplication;

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

  stopServer(port: number) {
    return new Promise((resolve, reject) => {
      if (!this.appMap[port]) {
        console.log(`端口 ${port} 未启动`);
        reject(`端口 【${port}】 未启动`);
        return;
      }

      for (const socket of this.appMap[port].x_sockets) {
        socket.destroy();
      }

      this.appMap[port].close((err) => {
        delete this.appMap[port];

        console.log(`Server on port ${port} 已关闭`, err || "");
        resolve(1);
      });
    });
  }
}

export default PreProxyServer;
