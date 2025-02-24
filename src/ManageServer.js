const express = require("express");

class ManageServer {
  static envList = [];
  static devServerList = [];

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

  constructor(preApp, postApp, basePath) {
    this.app = preApp;
    this.postApp = postApp;

    this.servers = {};
    this.router = express.Router();
    this.init();
    this.postApp.use(basePath, this.router);
  }

  startServer(port, name) {
    if (this.servers[port]) {
      console.log(`端口 ${port} 已经启动`);
      return;
    }

    const server = this.app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

    server.x_name = name;

    this.servers[port] = server;
  }

  stopServer(port) {
    return new Promise((resolve, reject) => {
      if (!this.servers[port]) {
        console.log(`端口 ${port} 未启动`);
        reject(`端口 ${port} 未启动`);
        return;
      }

      // 关闭所有连接
      this.servers[port].closeAllConnections();

      this.servers[port].close(() => {
        console.log(`Server on port ${port} 已关闭`);
        delete this.servers[port];
        resolve();
      });
    });
  }

  init() {
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
        if (this.servers[port]) {
          this.servers[port].x_name = name;
        } else {
          this.startServer(envPort, env.name);
        }
        return res.json({ message: `环境 ${name} 在端口 ${envPort} 已启动` });
      } else if (action === "stop") {
        return this.stopServer(envPort)
          .then(() => {
            return res.json({
              message: `环境 ${name} 在端口 ${envPort} 已关闭`,
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
          status:
            this.servers[item.port] &&
            this.servers[item.port].x_name === item.name
              ? "running"
              : "stop",
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
            .json({ error: "缺少 action 或 name 或者 port 参数" });
        }

        ManageServer.envList.some((item) => {
          if (item.name === name && item.port == port) {
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
          message: `环境 ${name} 在端口 ${port} 已经切换到 ${selectedDevServer.name}`,
        });
      }
    );
  }
}

module.exports = ManageServer;
