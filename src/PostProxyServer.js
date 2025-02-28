const path = require("path");
const express = require("express");
const expressStaticGzip = require("express-static-gzip");
const { createProxyMiddleware } = require("http-proxy-middleware");

const Utils = require("./Utils");
const ManageRouter = require("./ManageRouter");
/**
 * 后置代理服务器---同时也是管理页面的服务器
 */
class PostProxyServer {
  static envList = [];
  constructor(envConfig, preProxyServer) {
    this.envConfig = envConfig;
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

    // 静态资源
    app.use(expressStaticGzip(path.join(__dirname, "client")));

    // 错误处理
    app.use(this.errorHandler);

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

  updateConfig(newConfig) {
    const newEnvList = this.udpateEnvList(newConfig);
    const envConfig = {
      ...newConfig,
      envList: newEnvList,
    };
    this.manageRouter.envConfig = envConfig;

    this.preProxyServer.envConfig = envConfig;
  }

  udpateEnvList(newConfig) {
    const { envList: newEnvList, indexPage, devServerList } = newConfig;
    const { envList: oldEnvList = [] } = this.envConfig;

    const tempNewList = Utils.removeEnvDuplicates(newEnvList).map((item) => {
      item.indexPage = `${item.port}${item.indexPage || indexPage || ""}`;
      return item;
    });

    const envList = this.updateAndCleanEnvConfig(
      tempNewList,
      oldEnvList,
      devServerList
    );

    return envList;
  }

  /**
   * 重新加载环境配置之后，对比新旧环境配置，关闭已经删除的环境
   * @param {Array} newEnvList - 新的环境配置
   * @param {Array} oldEnvList - 旧的环境配置
   * @returns {Array}
   */
  updateAndCleanEnvConfig(newEnvList, oldEnvList, devServerList) {
    const newEnvMap = Utils.generateMap(newEnvList); // 生成端口号到环境配置的映射

    const oldEnvMap = Utils.generateMap(oldEnvList); // 生成端口号到环境配置的映射

    const devServerMap = Utils.generateMap(devServerList, ["name"]);

    const defautlDevserverName = devServerList[0]?.name ?? "";

    // 关闭已经删除的环境
    oldEnvList.forEach((item) => {
      if (
        !newEnvMap[`${item.name}+${item.port}`] &&
        this.manageRouter.getAppStatus(item.port, item.name) === "running"
      ) {
        this.preProxyServer.stopServer(item.port);
      }
    });

    // 返回新的环境配置
    const newList = newEnvList.map((item) => {
      const rowKey = `${item.name}+${item.port}`;
      const oldItem = oldEnvMap[rowKey] || {};

      const newItem = {
        ...item,
        status: this.manageRouter.getAppStatus(item.port, item.name),
        devServerName: oldItem.devServerName || item.devServerName,
      };

      if (!devServerMap[newItem.devServerName]) {
        newItem.devServerName = defautlDevserverName;
      }

      return newItem;
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

module.exports = PostProxyServer;
