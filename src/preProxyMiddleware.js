const { createProxyMiddleware } = require("http-proxy-middleware");

class PreProxyMiddleware {
  WEBPACK_DEV_SERVER = "http://localhost:5173";
  constructor() {
    this.proProxyMiddleware = null;
    this.createPreProxyMiddleware();
  }

  createPreProxyMiddleware() {
    // 前置转发：将请求转发到 Webpack 开发服务器
    this.proProxyMiddleware = createProxyMiddleware({
      changeOrigin: true,
      ws: true,
      router: () => {
        // 默认转发到 Webpack 开发服务器
        return this.WEBPACK_DEV_SERVER;
      },
      on: {
        proxyReq(proxyReq, req, res) {
          proxyReq.setHeader("X-API-Server", `${req.socket.localPort}`);
        },
      },
    });
  }

  updateWebpackDevServer(url) {
    this.WEBPACK_DEV_SERVER = url;
  }

  get getPreProxyMiddleware() {
    return this.proProxyMiddleware;
  }
}

module.exports = PreProxyMiddleware;
