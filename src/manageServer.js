const express = require("express");

class ManageServer {
  static envList = [
    {
      name: "dev",
      port: 3000,
      target: "http://localhost:3010",
    },
    {
      name: "test",
      port: 3001,
      target: "http://localhost:3011",
    },
    {
      name: "prod",
      port: 3002,
      target: "http://localhost:3012",
    },
    {
      name: "prod3013",
      port: 3003,
      target: "http://localhost:3013",
    },
    {
      name: "prod20",
      port: 3004,
      target: "http://localhost:3020",
    },
  ];

  constructor(preApp, postApp) {
    this.app = preApp;
    this.postApp = postApp;

    this.servers = {};
    this.router = express.Router();
    this.init();
    this.postApp.use("/dev-manage-api", this.router);
  }

  startInitServer() {
    this.startServer(ManageServer.envList[0].port);
  }

  startServer(port) {
    if (this.servers[port]) {
      console.log(`端口 ${port} 已经启动`);
      return;
    }

    const server = this.app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

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
      const { action, name } = req.body;

      if (!action || !name) {
        return res.status(400).json({ error: "缺少 action 或 name 参数" });
      }

      const env = ManageServer.envList.find((item) => item.name === name);
      if (!env) {
        return res.status(400).json({ error: "环境不存在" });
      }
      const port = env.port;

      if (action === "start") {
        this.startServer(port);
        return res.json({ message: `端口 ${port} 已启动` });
      } else if (action === "stop") {
        return this.stopServer(port)
          .then(() => {
            return res.json({ message: `端口 ${port} 已关闭` });
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
      const enableList = ManageServer.envList.map((item) => {
        return {
          name: item.name,
          port: item.port,
          target: item.target,
          status: this.servers[item.port] ? "running" : "stop",
        };
      });
      return res.json({ list: enableList });
    });
  }
}

module.exports = ManageServer;
