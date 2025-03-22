import express, { Request, Response } from "express";
import * as libCookie from "cookie";

import Utils from "./Utils.js";
import { Config } from "./Config.js";
import { EnvItem } from "./types.js";
import PreProxyServer from "./PreProxyServer.js";

// 定义请求体的类型
interface ManageServerRequest {
  action: string;
  name: string;
  port?: number;
}

class ManageRouter {
  router: express.Router;

  config: Config;

  constructor() {
    this.config = new Config();

    this.router = express.Router();

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

    // 用于检查是否重复启动
    this.router.get("/are-you-ok", (req, res) => {
      res.send(JSON.stringify(this.config));
    });
    // 用于 清除代理 的cookie
    this.router.get(
      "/clear-proxy-cookie",
      this.handleClearProxyCookie.bind(this)
    );
  }

  // 处理服务器管理请求
  handleManageServer(req: Request<{}, {}, ManageServerRequest>, res: Response) {
    const { action, name, port } = req.body;

    if (!action || !name || !port) {
      return res
        .status(400)
        .json({ error: "缺少 action 或 name 或 port 参数" });
    }

    const envKey = Utils.getRowKey(req.body);
    const env = this.config.envMap.get(envKey);
    if (!env) {
      return res.status(400).json({ error: "环境不存在，请刷新" });
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
  async handleStartServer(env: EnvItem, res: Response) {
    const port = env.port;
    if (PreProxyServer.appMap[port]) {
      await PreProxyServer.stopServer(env.port);
    }
    PreProxyServer.create(env);

    return res.json({
      message: `环境 【${env.name}】 在端口 【${port}】 已启动`,
    });
  }

  // 处理停止服务器
  handleStopServer(env: EnvItem, res: Response) {
    return PreProxyServer.stopServer(env.port)
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

  /**
   * 手动清除代理 cookie
   * @param req
   * @param res
   */
  handleClearProxyCookie(
    req: Request<{}, {}, ManageServerRequest>,
    res: Response
  ) {
    const cookies = req.headers.cookie;

    if (cookies) {
      const cookieArr = libCookie.parse(cookies);

      Object.keys(cookieArr).forEach((cookieName) => {
        if (cookieName.endsWith(this.config.envmConfig.cookieSuffix)) {
          res.appendHeader("Set-Cookie", `${cookieName}=; max-age=0; path=/`);
        }
      });
    }

    res.send({
      message: "Prefixed cookies cleared successfully.",
    });
  }

  // 处理获取环境列表
  handleGetList(req: Request, res: Response) {
    const list = Array.from(this.config.envMap.values());
    return res.json({ list });
  }

  // 处理获取开发服务器列表
  handleGetDevServerList(req: Request, res: Response) {
    const list = Array.from(this.config.devServerMap.values());
    return res.json({ list });
  }

  // 处理更新开发服务器ID
  handleUpdateDevServerId(req: Request<{}, {}, EnvItem>, res: Response) {
    const { devServerName, name, port } = req.body;

    if (!devServerName || !name || !port) {
      return res.status(400).json({
        error: "缺少 devServerName 或 name 或者 port 参数",
      });
    }

    const envKey = Utils.getRowKey(req.body);
    const envItem = this.config.envMap.get(envKey);
    if (!envItem) {
      return res.status(400).json({ error: "环境不存在，请刷新" });
    }

    const devServerKey = Utils.getRowKey({ name: devServerName });
    const devServerItem = this.config.devServerMap.get(devServerKey);
    if (!devServerItem) {
      return res.status(400).json({ error: "devServer 不存在，请刷新" });
    }

    envItem.devServerName = devServerName;

    return res.json({
      message: `环境 【${name}】 在端口 【${port}】 已经切换到 【${devServerItem.name}】`,
    });
  }

  getRouter() {
    return this.router;
  }
}

export default ManageRouter;
