const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * @typedef {Object} EnvConfig
 * @property {string} key
 * @property {string} index
 * @property {string} port
 * @property {object} devServer
 */

class PreProxyServer {
  constructor(envConfig) {
    this.envConfig = envConfig;

    this.devServerUrl = this.envConfig.devServerUrl;

    this.app = express();

    this.setupMiddlewares();

    this.listen();
  }

  updateDevServerUrl(devServerUrl) {
    this.devServerUrl = devServerUrl;
  }

  /**
   * @private
   * @returns {void}
   */
  setupMiddlewares() {
    let middlewares = [];

    const inMiddlewares = createProxyMiddleware({
      router: () => {
        return this.devServerUrl;
      },
      changeOrigin: true,
      headers: {
        "X-Proxy-By": "PreProxyServer",
        "X-Proxy-Target": this.envConfig.key,
      },
    });

    middlewares.push(inMiddlewares);

    if (this.envConfig.devServer.setupMiddlewares) {
      middlewares = this.envConfig.devServer.setupMiddlewares(middlewares, this);
    }

    for (const middleware of middlewares) {
      if (typeof middleware === "function") {
        this.app.use(middleware);
      } else if (typeof middleware.path !== "undefined") {
        this.app.use(middleware.path, middleware.middleware);
      } else {
        this.app.use(middleware.middleware);
      }
    }
  }

  listen() {
    const port = this.envConfig.devServer.port;
    this.server = this.app.listen(port, () => {
      console.log(`Proxy Service started on port ${port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log("Service stopped");
      });
    }
  }
}

module.exports = { PreProxyServer };
