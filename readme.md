[![npm][npm]][npm-url]
[![node][node]][node-url]
![npm](https://img.shields.io/npm/dw/env-manage-plugin.svg)

# EnvManage - 环境管理工具

`EnvManage` 是一款强大的环境管理工具，专为管理和代理多个开发环境而设计，特别适用于需要同时运行多个开发环境的场景。无论是小型项目还是大型企业级应用，`EnvManage` 都能极大地提升开发效率，简化环境管理流程。

```mermaid
graph LR
    A[前置转发服务1<br>端口 3000] -->|添加标志位 x-api-server: 1| B[开发服务器<br>端口 8080]
    C[前置转发服务2<br>端口 3001] -->|添加标志位 x-api-server: 2| B
    B --> D[后置转发服务<br>端口 3099]
    D -->|x-api-server: 1| E[API 服务器1]
    D -->|x-api-server: 2| F[API 服务器2]
```

## 🌟功能特性

- **动态环境管理**

  通过简单的配置文件 `env.config.js`，您可以轻松定义和管理多个开发环境。在该文件中，您能灵活设置不同环境的名称、端口、目标服务器地址等关键信息，实现对各个开发环境的精准区分与高效管理。

- **请求代理**

  支持前置和后置代理，确保请求准确无误地转发到指定的开发服务器。代理服务器会依据配置的目标服务器地址，将请求精准转发到对应的 API 服务器，保障数据交互顺畅。

- **配置文件热更新**

  无需繁琐的重启服务操作，`EnvManage` 支持配置文件热更新。当您对配置文件进行修改后，工具会自动检测并应用新的配置，显著提高开发效率，让您的开发过程更加流畅。

- **多服务器管理**

  轻松实现同时启动和管理多个开发服务器，并通过管理页面查看代理服务运行状态，同时可灵活启动或停止某个环境对应的服务器。

## 🚀 快速上手

### 安装

```bash
npm i -D envmange
```

或者全局安装

```bash
npm i -g envmange
```

### 配置

在项目根目录下创建 `env.config.js` 文件，根据实际需求定义开发环境和开发服务器列表。以下是各配置属性的详细说明

**配置文件示例**

```js
// env.config.js  支持CommonJS 和 ES Module
export default {
  // 管理服务器运行的端口，可根据实际需求修改，确保该端口未被其他程序占用
  port: 3099,
  // 基础路径，用于构建API请求的前缀，方便统一管理和识别与EnvManage相关的接口请求
  basePath: "/dev-manage-api",
  // 环境的索引路径，可作为环境的首页路径或特定的入口路径，可以被 envList 中的覆盖
  indexPage: "/Test",
  devServerList: [
    {
      // 为开发服务器命名，便于识别和管理，名称可自定义
      // prima key
      name: "your_dev_server_1",
      // 该开发服务器对应的目标地址，即实际提供服务的地址
      target: "http://localhost:5173",
    },
    // 可以添加更多开发服务器
  ],
  envList: [
    {
      // 为开发环境命名，如开发环境、测试环境等，方便区分
      // prima key
      name: "your_env_1",
      // 该环境对外暴露的端口，用于访问该环境下的应用
      // prima key
      port: 3000,
      // 该环境请求转发的目标服务器地址，通常是后端 API 服务地址
      target: "http://localhost:3010",
      // 环境的索引路径，可作为该环境的首页路径或特定的入口路径
      indexPage: "/Test",
      // 关联的开发服务器 ID  即索引
      devServerId: "0",
      // 路由规则函数，根据请求和环境信息，返回请求应转发到的目标地址
      // 自定义 目标地址 可以覆盖 target
      router: (req, env) => {
        return env.target;
      },
    },
    // 可以添加更多环境
  ],
};
```

**envList**

envList 的主键组合为 name 和 port 。若数据完全相同，则后一条数据会被忽略。对于 port 相同的情况，系统会自动进行互斥处理，即启动其中一个后，再尝试启动其他相同 port 的实例时，系统会自动关闭已启动的实例，避免冲突。

**devServerList**

devServerList 的主键为 name，相同则忽略后一个。

### 开发服务器配置

调整开发服务器，将需要代理到 API 服务器的请求，转发到 后置代理服务器。

**webpack-dev-server**

```js
// webpack.config.js

module.exports = {
  devServer: {
    proxy: {
      "/two": "http://localhost:3099",
    },
  },
};
```

**vite**

```js
// vite.config.js
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/dev-manage-api": {
        target: "http://localhost:3099",
        changeOrigin: true,
      },
      "/simple": {
        target: "http://localhost:3099",
        changeOrigin: true,
      },
      "/two": {
        target: "http://localhost:3099",
        changeOrigin: true,
      },
    },
  },
});
```

### 启动

运行以下命令启动管理服务器：

```bash
npx envmange
```

或者通过命令行参数指定配置文件路径：

```bash
npx envmanage --config ./path/to/env.config.js
```

访问管理页面 [http://localhost:3099/](http://localhost:3099/) 对各个代理服务进行管理。

### 配置文件热更新

如果需要修改环境配置，直接修改 `env.config.js` 文件，工具支持热更新，修改后无需重启服务即可生效。

## 依赖

- `express`: Web 框架，用于创建和管理服务器。
- `http-proxy-middleware`: 用于创建代理中间件，转发请求到目标服务器。
- `chokidar`: 用于监听配置文件的变化，实现热更新。
- `yargs`: 用于解析命令行参数。

## 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request。请在提交之前阅读 [贡献指南](CONTRIBUTING.md)。

## 作者

- [Your Name](https://github.com/yourusername)

---

感谢使用 `EnvManage`！如果你有任何问题或建议，请随时联系我们。

[npm]: https://img.shields.io/npm/v/env-manage-plugin.svg
[npm-url]: https://npmjs.com/package/env-manage-plugin
[node]: https://img.shields.io/node/v/env-manage-plugin.svg
[node-url]: https://nodejs.org
