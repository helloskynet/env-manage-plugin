const ManageServer = require("./ManageServer");

// 使用前置转发  所有请求都会先转发到webpack-dev-server
const PreProxyServer = require("./PreProxyServer");
const preProxyServer = new PreProxyServer();

// 后置转发 和 管理路由
const PostProxyServer = require("./PostProxyServer");
const postProxyServer = new PostProxyServer();

const manageServer = new ManageServer(
  preProxyServer.getApp,
  postProxyServer.getApp
);
