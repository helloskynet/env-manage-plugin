[![npm][npm]][npm-url]
[![node][node]][node-url]
![npm](https://img.shields.io/npm/dw/env-manage-plugin.svg)

# 开发环境管理插件

此项目是一个 开发环境管理 插件，使用 `Express` 启动新的服务器代理所有请求再转发到 `Dev Server`，经过在 `Dev Server`处理之后，`Dev Server` 可以将其他请求转发直接转发给环境服务器或者转发后置的代理服务器，由后置代理服务再次根据配置转发给对应的服务器。

包含一个用于控制服务器的管理界面。

## 功能

1. 支持 Webpack。
2. 可以独立启动
3. 使用 Express 和 http-proxy-middleware 将请求转发到 Dev Server。
4. 提供管理页面以启动和停止服务。

## 安装

```shell
npm i -D env-manage-plugin
```

配置 webpack

```js
const path = require("path");
const EnvManagePlugin = require("env-manage-plugin");

module.exports = {
  ...
  plugins: [
    new EnvManagePlugin({
      basePath: "/env",
      envConfigPath: path.resolve(__dirname, "./env.config.js"),
    }),
  ],
};
```

访问管理页面：

```shell
http://localhost:8080/env
```

[npm]: https://img.shields.io/npm/v/env-manage-plugin.svg
[npm-url]: https://npmjs.com/package/env-manage-plugin
[node]: https://img.shields.io/node/v/env-manage-plugin.svg
[node-url]: https://nodejs.org
