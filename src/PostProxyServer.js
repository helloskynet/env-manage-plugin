const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { PreProxyServer } = require("./PreProxyServer");

const defaultOptions = {
  port: 3000,
  basePath: "/env",
  envConfigPath: path.resolve(process.cwd(), "./env.config.js"),
};

class PostServer {
  constructor(plugindOption) {
    this.envPluginConfig = {};

    this.envConfigMap = new Map();
    this.proxyServerMap = new Map();

    this.options = Object.assign({}, defaultOptions, plugindOption);

    this.getEnvPluginConfig();

    this.app = this.createServer();

    this.setMangeRouter();

    this.setProxyRouter();

    this.listen();
  }

  updateDevServerUrl(devServerUrl) {
    PreProxyServer.devServerUrl = devServerUrl || this.envPluginConfig.devServerUrl || "http://localhost:8080";
  }

  get port() {
    return this.options.port;
  }

  /**
   * 获取插件的环境配置信息
   */
  getEnvPluginConfig() {
    const modulePath = this.options.envConfigPath;
    try {
      delete require.cache[require.resolve(modulePath)]; // 清除缓存
      this.envPluginConfig = require(modulePath);
    } catch (error) {
      console.error(`Failed to load module at ${modulePath}:`, error);
      this.envPluginConfig = { envList: [] }; // 设置默认值为空数组
    }
    this.envConfigMap.clear();

    this.envPluginConfig.envList.forEach((item, index) => {
      const key = `${item.key || index}`;
      item.key = key;
      this.envConfigMap.set(key, item);
    });

    this.updateDevServerUrl();

    if (this.envPluginConfig.port) {
      this.options.port = this.envPluginConfig.port;
    }

    if (this.envPluginConfig.basePath) {
      this.options.basePath = this.envPluginConfig.basePath;
    }

    this.updatePreDevServer();
  }

  /**
   * 配置重新加载之后，如果有环境已经删除则关闭对应的环境
   */
  updatePreDevServer() {
    for (const [key, inst] of this.proxyServerMap) {
      if (!this.envConfigMap.has(key)) {
        inst.stop();
        this.proxyServerMap.delete(key);
      }
    }
  }

  createServer() {
    return express();
  }

  listen() {
    this.app.listen(this.options.port, () => {
      console.log(`PostServer app listening on port ${this.options.port}`);
    });
  }

  /**
   * 设置管理路由
   */
  setMangeRouter() {
    const { basePath } = this.options;
    /**
     * 获取静态页面，环境列表页
     */
    this.app.get(`${basePath}/`, (request, response) => {
      response.sendFile(path.resolve(__dirname, "./static/index.html"));
    });

    /**
     * 获取环境列表
     */
    this.app.get(`${basePath}/api/getlist`, (request, response) => {
      const { protocol, hostname } = request;
      const ipAdress = `${protocol}://${hostname}`;
      this.envPluginConfig.envList.forEach((item) => {
        item.protocol = item.protocol || protocol;
        item.indexPage = `${ipAdress}:${item?.devServer?.port ?? "[auto]"}${item?.index ?? ""}`;
        item.status = this.proxyServerMap.has(item.key) ? "running" : "standby";
      });
      response.send(this.envPluginConfig.envList);
    });

    /**
     * 启动环境
     */
    this.app.get(`${basePath}/api/server/start`, async (request, response) => {
      const key = request.query.key;
      if (this.proxyServerMap.has(key)) {
        response.send({
          code: "1",
          message: "环境已经启动",
        });
      } else {
        const envConfig = this.envConfigMap.get(key);

        const preProxyServerConfig = {
          ...envConfig,
        };

        const appServer = new PreProxyServer(preProxyServerConfig);
        this.proxyServerMap.set(key, appServer);
        response.send({
          code: "0",
          message: "环境启动成功",
        });
      }
    });

    /**
     * 关闭环境
     */
    this.app.get(`${basePath}/api/server/stop`, (request, response) => {
      const key = request.query.key;
      if (this.proxyServerMap.has(key)) {
        const inst = this.proxyServerMap.get(key);
        inst.stop();
        this.proxyServerMap.delete(key);
        response.send({
          code: "0",
          message: "环境关闭成功",
        });
      } else {
        response.send({
          code: "1",
          message: "环境已经关闭",
        });
      }
    });

    /**
     * 更新环境的 devServerUrl
     */
    this.app.get(`${basePath}/api/server/updateurl`, (request, response) => {
      const serverurl = request.query.serverurl;
      this.updateDevServerUrl(serverurl);
      response.send({
        code: "0",
        message: "更新完成",
      });
    });

    /**
     * 查询的 devServerUrl
     */
    this.app.get(`${basePath}/api/server/geturl`, (request, response) => {
      response.send({
        code: "0",
        message: "",
        data: PreProxyServer.devServerUrl,
      });
    });

    /**
     * 重新加载环境配置
     */
    this.app.get(`${basePath}/api/server/reload`, (request, response) => {
      this.getEnvPluginConfig();
      response.send({
        code: "0",
        message: "更新完成",
      });
    });
  }

  /**
   * 设置代理转发路由
   */
  setProxyRouter() {
    const proxyMiddleware = createProxyMiddleware({
      pathFilter: (path, req) => {
        const key = req.header("X-Proxy-Target");
        return !!key;
      },
      router: (req) => {
        const key = req.header("X-Proxy-Target");
        const envConfig = this.envConfigMap.get(key);
        return envConfig.devServer.target;
      },
    });
    this.app.use(proxyMiddleware);
  }
}

module.exports = { PostServer };
