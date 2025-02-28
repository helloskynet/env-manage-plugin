// ManageRouter.js
const express = require("express");
const Utils = require("./Utils");

class ManageRouter {
  constructor(preProxyServer, envConfig) {
    this.router = express.Router();
    this.preProxyServer = preProxyServer;
    this.envConfig = envConfig;

    this.initializeRoutes();
  }

  initializeRoutes() {
    // 启动/停止服务器
    this.router.post(
      "/manage-server",
      express.json(),
      this.handleManageServer.bind(this)
    );

    // 获取环境列表
    this.router.get("/getlist", this.handleGetList.bind(this));

    // 获取开发服务器列表
    this.router.get(
      "/get-dev-server-list",
      this.handleGetDevServerList.bind(this)
    );

    // 更新开发服务器ID
    this.router.post(
      "/update-dev-server-id",
      express.json(),
      this.handleUpdateDevServerId.bind(this)
    );
  }

  // 处理服务器管理请求
  handleManageServer(req, res) {
    const { action, name, port } = req.body;

    if (!action || !name) {
      return res.status(400).json({ error: "缺少 action 或 name 参数" });
    }

    const env = this.findEnvByNameAndPort(name, port);
    if (!env) {
      return res.status(400).json({ error: "环境不存在" });
    }

    switch (action) {
      case "start":
        return this.handleStartServer(env, res);
      case "stop":
        return this.handleStopServer(env, res);
      default:
        return res.status(400).json({ error: "无效的 action 参数" });
    }
  }

  // 处理启动服务器
  handleStartServer(env, res) {
    const port = env.port;
    if (this.preProxyServer.appMap[port]) {
      this.preProxyServer.appMap[port].x_env = env;
    } else {
      this.preProxyServer.startServer(env);
    }
    return res.json({
      message: `环境 【${env.name}】 在端口 【${port}】 已启动`,
    });
  }

  // 处理停止服务器
  handleStopServer(env, res) {
    return this.preProxyServer
      .stopServer(env.port)
      .then(() => {
        return res.json({
          message: `环境 【${env.name}】 在端口 【${env.port}】 已关闭`,
        });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: "停止服务器失败" });
      });
  }

  // 处理获取列表
  handleGetList(req, res) {
    const { protocol, hostname } = req;
    const ipAdress = `${protocol}://${hostname}`;

    const list = this.envConfig.envList.map((item) => ({
      ...item,
      index: `${ipAdress}:${item.indexPage}`,
      status: this.getAppStatus(item.port, item.name),
    }));

    return res.json({ list });
  }

  // 处理获取开发服务器列表
  handleGetDevServerList(req, res) {
    const enableList = this.envConfig.devServerList.map((item) => ({
      name: item.name,
      target: item.target,
    }));
    return res.json({ list: enableList });
  }

  // 处理更新开发服务器ID
  handleUpdateDevServerId(req, res) {
    const { devServerName, name, port } = req.body;

    if (!devServerName || !name || !port) {
      return res.status(400).json({
        error: "缺少 devServerName 或 name 或者 port 参数",
      });
    }

    const env = this.findEnvByNameAndPort(name, port);
    if (!env) {
      return res.status(400).json({ error: "环境不存在" });
    }

    const selectedDevServer = this.findDevServerByName(devServerName);
    if (!selectedDevServer) {
      return res.status(400).json({ error: "devServer 不存在，请刷新" });
    }

    this.updateDateDevserverName(req.body);

    return res.json({
      message: `环境 【${name}】 在端口 【${port}】 已经切换到 【${selectedDevServer.name}】`,
    });
  }

  updateDateDevserverName(reqBody) {
    const { devServerName, name, port } = reqBody;

    const bodyKey = `${name}+${port}`;

    this.envConfig.envList.forEach((item) => {
      const rowKey = `${item.name}+${item.port}`;
      if (bodyKey === rowKey) {
        item.devServerName = devServerName;
      }
    });
  }

  // Helper methods
  findEnvByNameAndPort(name, port) {
    return this.envConfig.envList.find(
      (item) => item.name === name && item.port == port
    );
  }

  findDevServerByName(name) {
    return this.envConfig.devServerList.find((item) => item.name === name);
  }

  getAppStatus(port, name) {
    return this.preProxyServer.appMap[port]?.x_env?.name === name
      ? "running"
      : "stop";
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ManageRouter;
