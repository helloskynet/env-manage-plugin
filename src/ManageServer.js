const path = require("path");
const express = require("express");
const expressStaticGzip = require("express-static-gzip");
const { createProxyMiddleware } = require("http-proxy-middleware");

const Utils = require("./Utils");

const PreProxyServer = require("./PreProxyServer");

/**
 * 后置代理服务器---同时也是管理页面的服务器
 */
class ManageServer {
  static envList = [];
  static devServerList = [];
  static appMap = {}; // 保存所有的 app 实例

  static defautlDevserverName = "";

  static udpateEnvList(newEnvList, indexPage) {
    const tempNewList = Utils.removeEnvDuplicates(newEnvList).map((item) => {
      item.devServerName =
        item.devServerName || ManageServer.defautlDevserverName;
      item.indexPage = `${item.port}${item.indexPage || indexPage || ""}`;
      return item;
    });
    ManageServer.envList = ManageServer.updateAndCleanEnvConfig(
      tempNewList,
      ManageServer.envList
    );
  }

  /**
   * 重新加载环境配置之后，对比新旧环境配置，关闭已经删除的环境
   * @param {Array} newEnvList - 新的环境配置
   * @param {Array} oldEnvList - 旧的环境配置
   * @returns {Array}
   */
  static updateAndCleanEnvConfig(newEnvList, oldEnvList) {
    const newEnvMap = Utils.generateMap(newEnvList); // 生成端口号到环境配置的映射

    const oldEnvMap = Utils.generateMap(oldEnvList); // 生成端口号到环境配置的映射

    const devServerMap = Utils.generateMap(ManageServer.devServerList, [
      "name",
    ]);

    // 关闭已经删除的环境
    oldEnvList.forEach((item) => {
      if (
        !newEnvMap[`${item.name}+${item.port}`] &&
        ManageServer.isRunning(item.port, item.name)
      ) {
        ManageServer.stopServer(item.port);
      }
    });

    // 返回新的环境配置
    return newEnvList.map((item) => {
      const oldItem = oldEnvMap[`${item.name}+${item.port}`] || {};

      const newItem = {
        ...item,
        status: ManageServer.getAppStauts(item.port, item.name),
        devServerName: oldItem.devServerName || item.devServerName,
      };

      if (!devServerMap[newItem.devServerName]) {
        newItem.devServerName = ManageServer.defautlDevserverName;
      }
      return newItem;
    });
  }

  static updateDevServerList(newDevServerList) {
    ManageServer.devServerList = Utils.removeEnvDuplicates(newDevServerList);
    ManageServer.defautlDevserverName =
      ManageServer.devServerList[0]?.name || "";
  }

  /**
   * 查询选择的 devServer
   * @param {*} devServerName
   * @returns
   */
  static findSelectedDevServer(devServerName) {
    return (
      ManageServer.devServerList.find((item) => item.name === devServerName) ||
      {}
    );
  }

  /**
   * 获取运行中的环境 信息
   * @param {*} port
   * @returns
   */
  static findRunningEnv(port) {
    return (
      ManageServer.envList.find(
        (item) => `${item.port}` === `${port}` && item.status === "running"
      ) || {}
    );
  }

  /**
   * 判断对应的环境是否运行中
   * @param {*} port
   * @param {*} name
   * @returns
   */
  static isRunning(port, name) {
    return (
      ManageServer.appMap[port] && ManageServer.appMap[port].x_name === name
    );
  }

  static getAppStauts(port, name) {
    return ManageServer.isRunning(port, name) ? "running" : "stop";
  }

  constructor(envConfig) {
    // 使用前置转发  所有请求都会先转发到 dev-server
    this.preApp = new PreProxyServer().app;

    this.envConfig = envConfig;

    // 后置转发 和 管理路由
    this.postApp = this.initPostServer();

    this.router = express.Router();
    this.initManageRouter();
    this.postApp.use(this.envConfig.basePath, this.router);

    // 启动服务
    this.startServer();
  }

  initPostServer() {
    const postApp = express();

    // 挂载管理页面的静态路由
    postApp.use(
      this.envConfig.basePath,
      expressStaticGzip(path.join(__dirname, "client"))
    );

    // 挂载代理中间件
    postApp.use(this.createPostProxyMiddleware());

    // 错误处理
    postApp.use((err, req, res, next) => {
      if (err.message === "SKIP_PROXY") {
        // 跳过代理并继续执行下一个中间件
        return next();
      }

      // 其他错误处理
      res.status(500).send("代理服务器出错");
    });

    return postApp;
  }
  /**
   * 启动服务
   */
  startServer() {
    this.postApp.listen(this.envConfig.port, () => {
      console.log(
        `Post Proxy Middleware is running on http://localhost:${this.envConfig.port}`
      );
    });
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

  startServer2(port, name) {
    if (ManageServer.appMap[port]) {
      console.log(`端口 ${port} 已经启动`);
      return;
    }

    const server = this.preApp.listen(port, () => {
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

    ManageServer.appMap[port] = server;
  }

  static stopServer(port) {
    return new Promise((resolve, reject) => {
      if (!ManageServer.appMap[port]) {
        console.log(`端口 ${port} 未启动`);
        reject(`端口 【${port}】 未启动`);
        return;
      }

      ManageServer.appMap[port].close((err) => {
        console.log(`Server on port ${port} 已关闭`, err || "");
        delete ManageServer.appMap[port];
        resolve();
      });

      ManageServer.appMap[port].getConnections((err, count) => {
        if (err) {
          console.error("Error getting connections:", err);
        } else {
          console.log(`Active connections: ${count}`);
        }
        if (count > 0) {
          // 强制关闭所有活动的连接
          for (const socket of ManageServer.appMap[port].x_sockets) {
            socket.destroy(); // 强制关闭连接
          }
          console.log("Connection destroyed");
        }
      });
    });
  }

  initManageRouter() {
    this.router.post("/manage-server", express.json(), async (req, res) => {
      const { action, name, port } = req.body;

      if (!action || !name) {
        return res.status(400).json({ error: "缺少 action 或 name 参数" });
      }

      const env = ManageServer.envList.find(
        (item) => item.name === name && item.port == port
      );
      if (!env) {
        return res.status(400).json({ error: "环境不存在" });
      }
      const envPort = env.port;

      if (action === "start") {
        if (ManageServer.appMap[port]) {
          ManageServer.appMap[port].x_name = name;
        } else {
          this.startServer2(envPort, env.name);
        }
        return res.json({
          message: `环境 【${name}】 在端口 【${envPort}】 已启动`,
        });
      } else if (action === "stop") {
        return ManageServer.stopServer(envPort)
          .then(() => {
            return res.json({
              message: `环境 【${name}】 在端口 【${envPort}】 已关闭`,
            });
          })
          .catch((err) => {
            console.log(err);
            return res.json({ error: err });
          });
      } else {
        return res.status(400).json({ error: "无效的 action 参数" });
      }
    });

    this.router.get("/getlist", (req, res) => {
      const { protocol, hostname } = req;

      const ipAdress = `${protocol}://${hostname}`;

      ManageServer.envList.forEach((item) => {
        Object.assign(item, {
          index: `${ipAdress}:${item.indexPage}`,
          status: ManageServer.getAppStauts(item.port, item.name),
        });
      });

      return res.json({ list: ManageServer.envList });
    });

    this.router.get("/get-dev-server-list", (req, res) => {
      const enableList = ManageServer.devServerList.map((item) => {
        return {
          name: item.name,
          target: item.target,
        };
      });
      return res.json({ list: enableList });
    });

    this.router.post(
      "/update-dev-server-id",
      express.json(),
      async (req, res) => {
        const { devServerName, name, port } = req.body;

        if (!devServerName || !name || !port) {
          return res
            .status(400)
            .json({ error: "缺少 devServerName 或 name 或者 port 参数" });
        }

        ManageServer.envList.some((item) => {
          if (item.name === name && `${item.port}` === `${port}`) {
            item.devServerName = devServerName;
            return true;
          }
          return false;
        });

        const selectedDevServer =
          ManageServer.findSelectedDevServer(devServerName);

        if (!selectedDevServer) {
          return res.status(400).json({ error: "devServer 不存在，请刷新" });
        }

        return res.json({
          message: `环境 【${name}】 在端口 【${port}】 已经切换到 【${selectedDevServer.name}】`,
        });
      }
    );
  }
}

module.exports = ManageServer;
