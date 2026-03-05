# EnvManage - 多环境开发代理管理工具

<p align="center">
  <a href="https://www.npmjs.com/package/env-manage-plugin">
    <img src="https://img.shields.io/npm/v/env-manage-plugin.svg" alt="npm 版本">
  </a>
  <a href="https://www.npmjs.com/package/env-manage-plugin">
    <img src="https://img.shields.io/npm/dw/env-manage-plugin.svg" alt="npm 下载量">
  </a>
  <a href="https://nodejs.org">
    <img src="https://img.shields.io/node/v/env-manage-plugin.svg" alt="Node 版本">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/helloskynet/env-manage-plugin" alt="许可证">
  </a>
</p>

<p align="center">
  <strong>English</strong> | <a href="#中文">中文</a>
</p>

---

## 为什么选择 EnvManage？

在前端日常开发中，我们经常需要在多个环境之间切换：开发环境、测试环境、预发布环境、生产环境，或者是不同的功能分支。传统的开发方式存在诸多不便：

- **手动修改配置** - 每次切换环境都需要修改 API 基础 URL
- **频繁重启服务** - 改完配置还要重新启动开发服务器
- **Cookie 冲突** - 不同环境的登录状态相互覆盖
- **缺乏管理界面** - 无法直观查看和管理所有环境

EnvManage 应运而生，通过智能的多环境代理系统，帮你轻松解决以上所有问题。只需在可视化界面中简单配置，就能实现环境的快速切换和管理。

---

## ✨ 核心特性

### 🔄 智能请求路由
根据当前访问的端口，自动将请求路由到对应的 API 服务器。无需手动修改代码，切换环境只需切换端口。

### 🍪 独立 Cookie 存储
每个环境拥有独立的 Cookie 存储空间。在 3000 端口登录环境 A，再在 3001 端口登录环境 B，两者的登录状态互不影响。

### 🎯 可视化管理 Dashboard
简洁美观的管理界面，统一管理所有环境、开发服务器和代理配置。所有操作一目了然。

### 🚀 多服务器并行支持
同时启动多个开发服务器，通过界面一键启动/停止/切换，无需频繁重启。

### 🛠️ 广泛的主流工具兼容
无论你使用什么构建工具，都能无缝集成：

| 构建工具 | 支持状态 |
|----------|----------|
| Vite | ✅ 完全支持 |
| Webpack | ✅ 完全支持 |
| Rollup | ✅ 完全支持 |
| Rspack | ✅ 完全支持 |
| Esbuild | ✅ 完全支持 |
| Farm | ✅ 完全支持 |

### 📦 轻量级架构
极简依赖，无需复杂的基础设施，开箱即用，对现有项目零侵入。

---

## 🏗️ 工作原理

EnvManage 采用两级代理架构，确保请求能够准确到达目标服务器：

```
┌─────────────────────────────────────────────────────────────────┐
│                          浏览器                                  │
└─────────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  环境 A 代理     │    │  环境 B 代理     │    │  环境 C 代理     │
│  (端口 3000)    │    │  (端口 3001)    │    │  (端口 3002)    │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    后置代理服务 (端口 3099)                        │
│                   管理 Dashboard + 请求路由中心                    │
└─────────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API 服务器 A   │    │   API 服务器 B   │    │   API 服务器 C   │
│  (开发服务器)    │    │  (开发服务器)    │    │  (开发服务器)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 代理流程说明

1. **前置代理** (PreProxyServer)：每个环境对应一个独立代理服务器，监听不同端口
   - 接收前端请求
   - 负责 Cookie 改写和隔离
   - 将请求转发到后置代理

2. **后置代理** (PostProxyServer)：中央管理服务
   - 提供管理 Dashboard 界面
   - 接收所有前置代理的请求
   - 根据请求特征（Cookie/Header）路由到对应的 API 服务器
   - 统一处理响应

---

## 🚀 快速开始

### 1. 安装

```bash
# 使用 npm
npm install env-manage-plugin --save-dev

# 或使用 pnpm (推荐)
pnpm add env-manage-plugin -D

# 或使用 yarn
yarn add env-manage-plugin -D
```

### 2. 独立命令行启动

```bash
# 直接运行
npx envm

# 指定端口
npx envm -p 3000

# 查看所有可用选项
npx envm -h
```

启动成功后，浏览器访问 [http://localhost:3099](http://localhost:3099) 打开管理界面。

### 3. 集成到 Vite 项目

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { envmVitePlugin } from 'env-manage-plugin'

export default defineConfig({
  plugins: [
    envmVitePlugin({
      port: 3000,
      // 其他配置选项...
    })
  ]
})
```

### 4. 集成到 Webpack 项目

```javascript
// webpack.config.js
const { envmWebpackPlugin } = require('env-manage-plugin')

module.exports = {
  plugins: [
    envmWebpackPlugin({
      port: 3000
    })
  ]
}
```

### 5. 集成到其他构建工具

```typescript
// rollup.config.js
import { envmRollupPlugin } from 'env-manage-plugin'

export default {
  plugins: [envmRollupPlugin()]
}
```

```typescript
// rspack.config.js
import { envmRspackPlugin } from 'env-manage-plugin'

export default {
  plugins: [envmRspackPlugin()]
}
```

---

## ⚙️ 配置说明

### 配置优先级（从高到低）

1. **命令行参数** - 优先级最高
2. **环境变量** - `.env` 文件
3. **package.json** - 项目根目录的 `envm` 字段

### 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| port | number | 3099 | 管理服务端口号 |
| apiPrefix | string | /dev-manage-api | API 接口前缀，避免与项目 API 冲突 |
| cookieSuffix | string | envm | Cookie 后缀，用于 Cookie 隔离 |
| logLevel | string | info | 日志级别 (debug/info/warn/error) |

### 通过环境变量配置

在项目根目录创建 `.env` 文件：

```env
# 设置管理服务端口
envm_port=3099

# 设置 API 前缀
envm_apiPrefix=/dev-manage-api

# 设置 Cookie 后缀
envm_cookieSuffix=envm

# 设置日志级别
envm_logLevel=info
```

> 注意：环境变量添加 `envm_` 前缀是为了避免与其他应用的配置冲突。

### 通过 package.json 配置

```json
{
  "name": "my-project",
  "envm": {
    "port": 3099,
    "logLevel": "debug"
  }
}
```

---

## 📖 使用指南

### 创建第一个环境

1. 打开管理 Dashboard：[http://localhost:3099](http://localhost:3099)
2. 添加一个 **Dev Server**（开发服务器地址，如 `http://localhost:8080`）
3. 添加一个 **Environment**（环境名称、API 基础 URL、绑定开发服务器）
4. 点击播放按钮启动代理

### 配置你的开发服务器

将 API 请求代理到 EnvManage 后置服务：

**Vite 配置**

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3099'
    }
  }
})
```

**Webpack 配置**

```javascript
module.exports = {
  devServer: {
    proxy: {
      '/api': 'http://localhost:3099'
    }
  }
}
```

### Cookie 隔离说明

由于浏览器同源策略，同一域名的不同端口会共享 Cookie。例如：

- 在 `localhost:3000` 登录了"测试环境"
- 在 `localhost:3001` 登录了"开发环境"
- 第二次登录的 Cookie 会覆盖第一次的登录状态

EnvManage 通过以下方式解决：

1. **自动改写 Cookie 名称**：为每个环境的 Cookie 添加后缀（如 `token-3000-envm`）
2. **请求时还原**：转发请求时自动替换回原始 Cookie 名称
3. **一键清除**：管理界面提供"清除所有代理 Cookie"按钮

---

## 🎯 典型应用场景

| 场景 | 解决方案 |
|------|----------|
| 多功能分支并行开发 | 每个分支 → 不同端口环境 |
| 切换测试不同 API | Dashboard 中修改 API 基础 URL |
| 同时开发多个功能 | 同时启动多个环境 |
| 多环境登录状态冲突 | 自动 Cookie 隔离 |
| 前端依赖多个后端服务 | 分别配置不同的 API 地址 |

---

## 🤝 贡献指南

欢迎贡献代码！请先阅读贡献指南：

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建项目
pnpm build

# 代码检查
pnpm lint
```

---

## 📄 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 🧡 技术鸣谢

本项目基于以下优秀开源项目构建：

- [Express](https://expressjs.com) - Node.js Web 框架
- [Vue 3](https://vuejs.org) - 渐进式前端框架
- [Element Plus](https://element-plus.org) - Vue 3 组件库
- [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware) - HTTP 代理中间件
- [LokiJS](https://lokijs.org) - 内存数据库
- [Unplugin](https://unplugin.unjs.io) - 统一插件系统

---

## 🆘 获取帮助

- 📖 [详细文档](packages/server/readme.md)
- 🐛 [问题反馈](https://github.com/helloskynet/env-manage-plugin/issues)
- 💬 [讨论交流](https://github.com/helloskynet/env-manage-plugin/discussions)

---

<p align="center">由 <a href="https://github.com/helloskynet">helloskynet</a> 用 ❤️ 构建