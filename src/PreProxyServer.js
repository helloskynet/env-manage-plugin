const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

class PreProxyServer {
  constructor(envConfig) {
    this.envConfig = envConfig;

    this.devServerUrl = this.envConfig.devServerUrl;
    this.start();
  }

  updateDevServerUrl(devServerUrl) {
    this.devServerUrl = devServerUrl;
  }

  start() {
    const { localPort: port, key } = this.envConfig;
    const app = express();

    const proxyMiddleware = createProxyMiddleware({
      router: () => {
        return this.devServerUrl;
      },
      changeOrigin: true,
      headers: {
        "X-Proxy-By": "PreProxyServer",
        "X-Proxy-Target": key,
      },
    });

    app.use(proxyMiddleware);

    const server = app.listen(port, () => {
      console.log(`Proxy Service started on port ${port}`);
    });

    this.server = server;
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
