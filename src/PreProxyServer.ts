// 从 http-proxy-middleware 模块中导入 createProxyMiddleware 函数
import { createProxyMiddleware } from "http-proxy-middleware";
// 导入 express 模块
import express, { Application, Request } from "express";
import { Server } from "http";
import { Socket } from "net";
// 导入本地的 Utils 模块
import Utils from "./Utils.js";
import { Config, EnvConfig, EnvItem } from "./Config.js";

type MyApplication = Server & {
  /**
   * 绑定的环境名称
   */
  x_name: string;

  /**
   * 相关的socket链接，用于在关闭服务器的时候，提断开相关链接
   */
  x_sockets: Set<Socket>;
};

class PreProxyServer {
  app: Application;

  /**
   * 保存启动的环境实例
   */
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
        const port = `${req.socket.localPort}`;
        const name = this.appMap[port]?.x_name;

        const devServerConfig = this.config.findDevServerForEnv(name, port);
        // 默认转发到 Webpack 开发服务器
        return devServerConfig?.target;
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
    Object.entries(this.appMap).forEach(([port, item]) => {
      const rowKey = Utils.getRowKey({
        name: item.x_name,
        port,
      });
      if (envMapWithNamAndPort[rowKey]) {
        item.x_name = envMapWithNamAndPort[rowKey].name;
      } else {
        this.stopServer(port);
      }
    });
  }

  startServer(envConfig: EnvItem) {
    const { port, name } = envConfig;
    if (this.appMap[port]) {
      console.log(`端口 ${port} 已经启动`);
      return;
    }

    const server = this.app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    }) as MyApplication;

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

  stopServer(port: number | string) {
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
