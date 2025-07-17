import express, { Request, Response } from "express";
import * as libCookie from "cookie";

import { Container } from "./Container.js";
import { EnvController } from "./controllers/EnvController.js";
import { DevServerController } from "./controllers/DevServerController.js";
import { config } from "./ResolveConfig.js";

// 定义请求体的类型
interface ManageServerRequest {
  action: string;
  name: string;
  port?: number;
}

class ManageRouter {
  router: express.Router;

  constructor() {
    this.router = express.Router();

    this.router.use(express.json());

    this.initializeRoutes();
  }

  initializeRoutes() {
    // 依赖注入容器
    const container = Container.getInstance();

    const devServerController = container.get<DevServerController>(
      "devServerController"
    );

    // 获取环境控制器
    const envController = container.get<EnvController>("envController");
    // 启动代理服务器
    this.router.post(
      "/server/start",
      envController.handleStartServer.bind(devServerController)
    );
    // 停止代理服务器
    this.router.post(
      "/server/stop",
      envController.handleStopServer.bind(devServerController)
    );
    // 获取环境列表
    this.router.get(
      "/getlist",
      envController.handleGetList.bind(envController)
    );
    // 新增环境
    this.router.post(
      "/env/add",
      envController.handleAddEnv.bind(envController)
    );
    // 删除环境
    this.router.post(
      "/env/delete",
      envController.handleDeleteEnv.bind(envController)
    );

    // 获取开发服务器列表
    this.router.get(
      "/dev-server/list",
      devServerController.handleGetDevServerList.bind(devServerController)
    );

    // 更新开发服务器ID
    this.router.post(
      "/update-dev-server-id",
      envController.handleUpdateDevServerId.bind(envController)
    );

    // 用于检查是否重复启动
    this.router.get("/are-you-ok", (req, res) => {
      res.send(JSON.stringify({ message: "I'm ok!" }));
    });
    // 用于 清除代理 的cookie
    this.router.get(
      "/clear-proxy-cookie",
      this.handleClearProxyCookie.bind(envController)
    );
  }

  /**
   * 手动清除代理 cookie
   * @param req
   * @param res
   */
  handleClearProxyCookie(
    req: Request<unknown, unknown, ManageServerRequest>,
    res: Response
  ) {
    const cookies = req.headers.cookie;

    if (cookies) {
      const cookieArr = libCookie.parse(cookies);

      Object.keys(cookieArr).forEach((cookieName) => {
        if (cookieName.endsWith(config.cookieSuffix)) {
          res.appendHeader("Set-Cookie", `${cookieName}=; max-age=0; path=/`);
        }
      });
    }

    res.send({
      message: "Prefixed cookies cleared successfully.",
    });
  }

  getRouter() {
    return this.router;
  }
}

export default ManageRouter;
