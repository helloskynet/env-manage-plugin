const express = require("express");
const ManageServer = require("./manageServer");
const PreProxyMiddleware = require("./preProxyMiddleware");

const app = express();

// 注册管理路由
const manageServer = new ManageServer(app);

const preProxyMiddleware = new PreProxyMiddleware();
// 使用前置转发  所有请求都会先转发到webpack-dev-server
app.use(preProxyMiddleware.getPreProxyMiddleware);

manageServer.startInitServer();
