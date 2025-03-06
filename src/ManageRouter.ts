// 导入 express 模块
import express, { Request, Response } from "express";
import PreProxyServer from "./PreProxyServer";
import { Config, EnvItem } from "./Config";
import Utils from "./Utils";

// 定义请求体的类型
interface ManageServerRequest {
  action: string;
  name: string;
  port?: number; // 如果 port 是可选的
}

class ManageRouter {
  router: express.Router;

  preProxyServer: PreProxyServer;

  config: Config;

  activeDevServer: Record<string, EnvItem>;

  /**
   * 保存运行中的环境
   */
  runningApplication: {
    [key: string]: Boolean;
  };

  get envConfig() {
    return this.config.envConfig;
  }

  constructor(preProxyServer: PreProxyServer) {
    this.config = new Config();

    this.router = express.Router();
    this.preProxyServer = preProxyServer;

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
  handleManageServer(req: Request<{}, {}, ManageServerRequest>, res: Response) {
    const { action, name, port } = req.body;

    if (!action || !name) {
      return res.status(400).json({ error: "缺少 action 或 name 参数" });
    }

    const env = this.findEnvByNameAndPort(name, port);
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
  handleStartServer(env: EnvItem, res: Response) {
    const port = env.port;
    if (this.preProxyServer.appMap[port]) {
      this.preProxyServer.appMap[port].x_name = env.name;
    } else {
      this.preProxyServer.startServer(env);
    }
    return res.json({
      message: `环境 【${env.name}】 在端口 【${port}】 已启动`,
    });
  }

  // 处理停止服务器
  handleStopServer(env: EnvItem, res: Response) {
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
  handleGetList(req: Request, res: Response) {
    const list = this.envConfig.envList.map((item) => {
      const rowKey = Utils.getRowKey(item);
      const devServerName =
        this.config.envToDevServerMap[rowKey] || item.devServerName;
      return {
        ...item,
        devServerName,
        status: this.getAppStatus(item.name, item.port),
      };
    });

    return res.json({ list });
  }

  // 处理获取开发服务器列表
  handleGetDevServerList(req: Request, res: Response) {
    const enableList = this.envConfig.devServerList;
    return res.json({ list: enableList });
  }

  // 处理更新开发服务器ID
  handleUpdateDevServerId(req: Request<{}, {}, EnvItem>, res: Response) {
    const { devServerName, name, port } = req.body;

    if (!devServerName || !name || !port) {
      return res.status(400).json({
        error: "缺少 devServerName 或 name 或者 port 参数",
      });
    }

    const env = this.findEnvByNameAndPort(name, port);
    if (!env) {
      return res.status(400).json({ error: "环境不存在，请刷新" });
    }

    const selectedDevServer = this.findDevServerByName(devServerName);
    if (!selectedDevServer) {
      return res.status(400).json({ error: "devServer 不存在，请刷新" });
    }

    const rowKey = Utils.getRowKey(req.body);
    this.config.envToDevServerMap[rowKey] = devServerName;

    return res.json({
      message: `环境 【${name}】 在端口 【${port}】 已经切换到 【${selectedDevServer.name}】`,
    });
  }

  // Helper methods
  findEnvByNameAndPort(name: string, port: number) {
    const targetKey = Utils.getRowKey({
      name,
      port,
    });
    return this.envConfig.envList.find((item) => {
      const rowKey = Utils.getRowKey(item);
      return rowKey === targetKey;
    });
  }

  findDevServerByName(name: string) {
    return this.envConfig.devServerList.find((item) => item.name === name);
  }

  getAppStatus(name: string, port: number) {
    return this.preProxyServer.appMap[port]?.x_name === name
      ? "running"
      : "stop";
  }

  getRouter() {
    return this.router;
  }
}

export default ManageRouter;
