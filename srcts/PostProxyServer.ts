// 导入 path 模块
import * as path from "path";
// 导入 express 模块
import express from "express";
// 导入 express-static-gzip 模块
import expressStaticGzip from "express-static-gzip";
// 从 http-proxy-middleware 模块导入 createProxyMiddleware 函数
import { createProxyMiddleware } from "http-proxy-middleware";

// 导入本地的 Utils 模块
import Utils from "./Utils";
// 导入本地的 ManageRouter 模块
import ManageRouter from "./ManageRouter";

/**
 * 后置代理服务器---同时也是管理页面的服务器
 */
class PostProxyServer {
  get envConfig() {
    return this.manageRouter.envConfig;
  }

  set envConfig(newConfig) {
    const newEnvList = this.udpateEnvList(newConfig);
    const envConfig = {
      ...newConfig,
      envList: newEnvList,
    };
    this.manageRouter.envConfig = envConfig;

    this.preProxyServer.envConfig = envConfig;
  }

  constructor(envConfig, preProxyServer) {
    // this.envConfig = envConfig;
    this.preProxyServer = preProxyServer;

    // 初始化服务器
    this.app = this.initializeServer();

    // 初始化管理路由
    this.manageRouter = new ManageRouter(preProxyServer, envConfig);
    this.app.use(envConfig.basePath, this.manageRouter.getRouter());

    // 启动服务器
    this.startServer();
  }

  initializeServer() {
    const app = express();

    // 代理中间件
    app.use(this.createPostProxyMiddleware());

    // 无需代理的数据继续下一个中间件
    app.use(this.errorHandler);

    // 静态资源
    app.use(expressStaticGzip(path.join(__dirname, "client")));

    return app;
  }

  createPostProxyMiddleware() {
    return createProxyMiddleware({
      changeOrigin: true,
      ws: true,
      router: (req) => {
        if (req.headers["x-api-server"]) {
          const port = req.headers["x-api-server"];

          const env = this.preProxyServer.appMap[port].x_env;

          if (env?.router) return env.router(req, env);
          if (env?.target) return env.target;
        }
        throw new Error("SKIP_PROXY");
      },
    });
  }

  errorHandler(err, req, res, next) {
    if (err.message === "SKIP_PROXY") return next();
    res.status(500).send("代理服务器出错");
  }

  udpateEnvList(newConfig) {
    const { envList: newEnvList, indexPage, devServerList } = newConfig;
    const { envList: oldEnvList = [] } = this.envConfig;

    const newListAfter = Utils.removeEnvDuplicates(newEnvList);

    const oldEnvMap = Utils.generateMap(oldEnvList); // 生成端口号到环境配置的映射

    const devServerMap = Utils.generateMap(devServerList, ["name"]);

    const defautlDevserverName = devServerList[0]?.name ?? "";

    // 返回新的环境配置
    const newList = newListAfter.map((item) => {
      const rowKey = `${item.name}+${item.port}`;

      let devServerName =
        oldEnvMap?.[rowKey]?.devServerName || item.devServerName;

      if (!devServerMap[devServerName]) {
        devServerName = defautlDevserverName;
      }

      return {
        ...item,
        indexPage: `${item.indexPage || indexPage || ""}`,
        devServerName,
      };
    });

    return newList;
  }

  /**
   * 启动服务
   */
  startServer() {
    this.app.listen(this.envConfig.port, () => {
      console.log(
        `Post Proxy Middleware is running on http://localhost:${this.envConfig.port}`
      );
    });
  }
}

export default PostProxyServer;
