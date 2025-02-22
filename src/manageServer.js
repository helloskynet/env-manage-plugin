const express = require("express");

class ManageServer {
  constructor(app) {
    this.app = app;
    this.servers = {};
    this.router = express.Router();
    this.init();
    this.app.use("/manage-server", this.router);
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
    if (!this.servers[port]) {
      console.log(`端口 ${port} 未启动`);
      return;
    }

    this.servers[port].close(() => {
      console.log(`Server on port ${port} 已关闭`);
      delete this.servers[port];
    });
  }

  init() {
    this.router.post("/manage-ports", express.json(), (req, res) => {
      const { action, port } = req.body;

      if (!action || !port) {
        return res.status(400).json({ error: "缺少 action 或 port 参数" });
      }

      if (action === "start") {
        this.startServer(port);
        return res.json({ message: `端口 ${port} 已启动` });
      } else if (action === "stop") {
        this.stopServer(port);
        return res.json({ message: `端口 ${port} 已关闭` });
      } else {
        return res.status(400).json({ error: "无效的 action 参数" });
      }
    });
  }
}

module.exports = ManageServer;

// 默认启动一些端口
// const initialPorts = [4000, 4001, 4002];
// initialPorts.forEach((port) => startServer(port));

// // 提供一个接口，查看当前运行的端口
// app.get("/active-ports", (req, res) => {
//   const activePorts = Object.keys(servers).map(Number);
//   res.json({ activePorts });
// });
