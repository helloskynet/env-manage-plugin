import { Socket } from "net";
import { Server } from "http";
import express, { Application, Request } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

import Utils from "./Utils.js";
import { Config, FILE_CHANGE_EVENT } from "./Config.js";
import { EnvItem } from "./types.js";

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
  static appMap: {
    [key: string]: MyApplication;
  } = {};

  static config = new Config();

  static {
    PreProxyServer.config.bus.on(FILE_CHANGE_EVENT, () => {
      PreProxyServer.updateAppMapAfterConfigFileChange();
    });
  }

  static create(envConfig: EnvItem) {
    const { port } = envConfig;
    if (PreProxyServer.appMap[port]) {
      console.log(`端口 ${port} 已经启动`);
      return null;
    }

    return new PreProxyServer(envConfig);
  }

  constructor(envConfig: EnvItem) {
    this.app = express();
    this.app.use(this.createPreProxyMiddleware());
    this.startServer(envConfig);
  }

  /**
   * 生成代理中间件
   * @returns
   */
  createPreProxyMiddleware() {
    // 前置转发：将请求转发到 Webpack 开发服务器
    return createProxyMiddleware({
      ws: true,
      changeOrigin: true,
      router: (req) => {
        const port = `${req.socket.localPort}`;
        const name = PreProxyServer.appMap[port]?.x_name;

        const devServerConfig = PreProxyServer.config.findDevServerForEnv(
          name,
          port
        );
        // 默认转发到 Webpack 开发服务器
        return devServerConfig?.target;
      },
      on: {
        proxyReq(proxyReq, req: Request, res) {
          proxyReq.setHeader("X-API-Server", `${req.socket.localPort}`);
        },
        proxyReqWs(proxyReq, req: Request, res) {
          proxyReq.setHeader("X-API-Server", `${req.socket.localPort}`);
        },
      },
    });
  }

  /**
   * 启动服务
   * @param envConfig
   * @returns
   */
  startServer(envConfig: EnvItem) {
    const { port, name } = envConfig;
    if (PreProxyServer.appMap[port]) {
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

    PreProxyServer.appMap[port] = server;
  }

  static stopServer(port: number | string) {
    return new Promise((resolve, reject) => {
      if (!PreProxyServer.appMap[port]) {
        console.log(`端口 ${port} 未启动`);
        reject(`端口 【${port}】 未启动`);
        return;
      }

      for (const socket of PreProxyServer.appMap[port].x_sockets) {
        socket.destroy();
      }

      PreProxyServer.appMap[port].close((err) => {
        delete PreProxyServer.appMap[port];

        console.log(`Server on port ${port} 已关闭`, err || "");
        resolve(1);
      });
    });
  }

  /**
   * 配置文件变更 检查再配置中已经不存在的环境，并关闭改环境
   * @param newConfig
   */
  static updateAppMapAfterConfigFileChange() {
    const envList = PreProxyServer.config.envConfig.envList;
    const envMapWithNamAndPort = Utils.generateMap(envList);

    Object.entries(PreProxyServer.appMap).forEach(([port, item]) => {
      const rowKey = Utils.getRowKey({
        name: item.x_name,
        port,
      });
      if (!envMapWithNamAndPort[rowKey]) {
        PreProxyServer.stopServer(port);
      }
    });
  }
}

export default PreProxyServer;
