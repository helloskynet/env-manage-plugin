import { Socket } from "net";
import { ClientRequest, IncomingMessage, Server, ServerResponse } from "http";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import setCookieParser, { Cookie } from "set-cookie-parser";
import * as libCookie from "cookie";
import { minimatch } from "minimatch";
import * as fs from "fs";
import * as path from "path";

import { getConfig } from "../utils/ResolveConfig.js";
import { EnvRepo } from "../repositories/EnvRepo.js";
import { DevServerRepo } from "../repositories/DevServerRepo.js";
import { RouteRuleRepo } from "../repositories/RouteRuleRepo.js";
import { EnvModel } from "../types/index.js";
import { devServerLogger } from "../utils/logger.js";

class PreProxyServer {
  /**
   * 代理服务器
   */
  server!: Server;

  /**
   * 保存当前代理的 socket 连接 关闭前先断开所有链接
   */
  sockets!: Set<Socket>;

  /**
   * 判断该端口是否已经有服务存在
   * @param port
   * @returns
   */
  static getAppInsByPort(port: string) {
    return this.appMap[port];
  }

  /**
   * 保存启动的环境实例
   */
  private static appMap: {
    [key: string]: PreProxyServer;
  } = {};

  static async create(
    envId: string,
    envRepo: EnvRepo,
    devServerRepo: DevServerRepo,
    routeRuleRepo: RouteRuleRepo
  ) {
    if (this.appMap[envId]) {
      devServerLogger.info(`环境 ${envId} 已经启动`);
      return null;
    }

    const preProxyServer = new PreProxyServer(
      envId,
      envRepo,
      devServerRepo,
      routeRuleRepo
    );
    await preProxyServer.startServer();
    PreProxyServer.appMap[envId] = preProxyServer;
    return preProxyServer;
  }

  private constructor(
    private envId: string,
    private envRepo: EnvRepo,
    private devServerRepo: DevServerRepo,
    private routeRuleRepo: RouteRuleRepo,
    private app = express()
  ) {
    // 代理 /envm-inject 开头的请求到 ProxyServer（PostProxyServer）
    app.use("/envm-inject", this.createInjectProxyMiddleware());

    // 主代理中间件
    app.use(this.createPreProxyMiddleware());
  }

  /**
   * 创建注入脚本的代理中间件
   * 代理所有 /envm-inject 开头的请求到 ProxyServer
   */
  private createInjectProxyMiddleware() {
    return createProxyMiddleware({
      ws: true,
      router: () => {
        const config = getConfig();
        // 代理到 ProxyServer（后置代理服务器）
        return `http://localhost:${config.port}/envm-inject`;
      },
    });
  }

  /**
   *
   * @returns 获取绑定的环境信息
   */
  getEnvItem() {
    const envItem = this.envRepo.findOneById(this.envId);
    return envItem as EnvModel;
  }

  /**
   * 获取绑定的服务器详情
   */
  getDevServer() {}

  /**
   * 当前 代理的 cookie 后缀
   */
  get cookieSuffix() {
    const envItem = this.getEnvItem();
    return `-${envItem?.port}-${PreProxyServer.configCookieSuffix}`;
  }

  /**
   * 配置的 cookie 后缀
   */
  static get configCookieSuffix() {
    return `${getConfig().cookieSuffix}`;
  }

  /**
   * 根据请求路径匹配路由规则，检查是否需要注入 Script
   * @param requestPath 请求路径
   * @returns 是否需要注入 Script
   */
  private shouldInjectScript(requestPath: string): boolean {
    const routeRules = this.routeRuleRepo.getByEnvId(this.envId);
    const enabledRules = routeRules.filter((rule) => rule.enabled !== false);

    for (const rule of enabledRules) {
      if (minimatch(requestPath, rule.pathPrefix, { dot: true })) {
        return rule.injectScript === true;
      }
    }
    return false;
  }

  /**
   * 根据请求路径匹配路由规则
   * @param requestPath 请求路径
   * @returns 匹配到的目标环境地址，如果没有匹配则返回 null
   */
  private matchRouteRule(requestPath: string): string | null {
    const routeRules = this.routeRuleRepo.getByEnvId(this.envId);

    // 过滤出已启用的规则
    const enabledRules = routeRules.filter((rule) => rule.enabled !== false);

    // 按 pathPrefix 长度降序排序，确保最长前缀匹配优先
    const sortedRules = [...enabledRules].sort(
      (a, b) => b.pathPrefix.length - a.pathPrefix.length
    );

    for (const rule of sortedRules) {
      // 使用 minimatch 支持 glob 模式匹配
      if (minimatch(requestPath, rule.pathPrefix, { dot: true })) {
        // 获取目标环境信息
        if (rule.targetEnvId) {
          const targetEnv = this.envRepo.findOneById(rule.targetEnvId);
          if (targetEnv?.apiBaseUrl) {
            devServerLogger.info(
              `路由规则匹配成功: ${requestPath} -> ${rule.pathPrefix}, 转发到: ${targetEnv.apiBaseUrl}`
            );
            return targetEnv.apiBaseUrl;
          }
        }
      }
    }
    return null;
  }

  /**
   * 生成代理中间件
   * @returns
   */
  createPreProxyMiddleware() {
    // 前置转发：将请求转发到 开发服务器
    return createProxyMiddleware({
      ws: true,
      changeOrigin: true,
      selfHandleResponse: true,
      router: (req: IncomingMessage & { path?: string }) => {
        const requestPath = req.path || "/";

        // 1. 检查是否配置了路由规则
        const customTarget = this.matchRouteRule(requestPath);
        if (customTarget) {
          return customTarget;
        }

        // 2. 默认转发到 devServer
        const envItem = this.getEnvItem();
        const devServerConfig = this.devServerRepo.findOneById({
          id: envItem?.devServerId ?? "",
        });
        return `${devServerConfig?.devServerUrl}`;
      },
      on: {
        proxyReq: (proxyReq, req: IncomingMessage & { path?: string }) => {
          const requestPath = req.path || "/";

          // 优先使用路由规则的目标地址，否则使用环境默认的 apiBaseUrl
          const customTarget = this.matchRouteRule(requestPath);
          const target = customTarget || `${this.getEnvItem()?.apiBaseUrl}`;
          proxyReq.setHeader("x-api-server", `${target}`);
          this._rewrieCookieOnProxyReq(proxyReq, req);
        },
        proxyRes: (proxyRes, req, res) => {
          this._rewriteSetCookieOnProxyRes(proxyRes);
          this._rewriteLoginRedirect(proxyRes, req, res);
        },
        proxyReqWs: (proxyReq, req: IncomingMessage & { path?: string }) => {
          const requestPath = req.path || "/";
          const customTarget = this.matchRouteRule(requestPath);
          const target = customTarget || `${this.getEnvItem()?.apiBaseUrl}`;
          proxyReq.setHeader("x-api-server", `${target}`);
        },
      },
    });
  }

  /**
   * 代理的时候如果收到了 setcookie 请求
   * 给 每一个 setcookie 追加保存一个 代理cookie
   * @param proxyRes
   */
  private _rewriteSetCookieOnProxyRes(proxyRes: IncomingMessage) {
    const envItem = this.getEnvItem();
    const setCookie = proxyRes.headers["set-cookie"];
    if (envItem && setCookie) {
      const setCookies = setCookieParser.parse(setCookie);
      const proxyCookie = setCookies.map((item: Cookie) => {
        const cookie = {
          ...item,
          name: `${item.name}${this.cookieSuffix}`,
        };
        return libCookie.serialize(
          cookie.name,
          cookie.value,
          cookie as libCookie.SerializeOptions
        );
      });
      setCookie.push(...proxyCookie);
    }
  }

  /**
   * 代理 转发的时候，将对应端口的cookie 重写回去
   */
  private _rewrieCookieOnProxyReq(
    proxyReq: ClientRequest,
    req: IncomingMessage
  ) {
    const envItem = this.getEnvItem();
    if (envItem && req.headers.cookie) {
      const cookie = libCookie.parse(req.headers.cookie || "");
      const newCookies: string[] = [];

      Object.keys(cookie).forEach((item) => {
        if (item.endsWith(PreProxyServer.configCookieSuffix)) {
          return;
        }
        let cookieName = `${item}${this.cookieSuffix}`;
        if (!cookie[cookieName]) {
          cookieName = item;
        }
        newCookies.push(libCookie.serialize(item, cookie[cookieName] || ""));
      });

      proxyReq.setHeader("cookie", newCookies.join(";"));
    }
  }

  _rewriteLoginRedirect(
    proxyRes: IncomingMessage,
    req: IncomingMessage & { path?: string },
    res: ServerResponse<IncomingMessage>
  ) {
    const contentType = proxyRes.headers["content-type"] || "";
    const requestPath = req.path || "/";

    // 转发状态码 + 响应头
    res.statusCode = proxyRes.statusCode || 200;
    for (const key in proxyRes.headers) {
      if (!res.headersSent && proxyRes.headers[key]) {
        res.setHeader(key, proxyRes.headers[key]);
      }
    }

    const chunks: Buffer[] = [];
    proxyRes.on("data", (chunk) => chunks.push(chunk));
    proxyRes.on("end", () => {
      try {
        const body = Buffer.concat(chunks);

        // 只对 HTML && 路由规则开启注入的路径
        if (contentType.includes("text/html") && this.shouldInjectScript(requestPath)) {
          const config = getConfig();
          const scriptDir = config.injectScriptDir;

          if (!scriptDir) {
            devServerLogger.warn("未配置注入脚本目录 (injectScriptDir)");
            res.end(body);
            return;
          }

          let html = body.toString("utf8");

          // 读取文件夹下所有 js 文件（排除 # 开头的文件）
          const scriptTags = this.generateImportScripts(scriptDir);

          html = html.replace(/<\/body>\s*<\/html>/gi, `${scriptTags}</body></html>`);
          const newBody = Buffer.from(html, "utf8");
          res.setHeader("Content-Length", newBody.length);
          res.end(newBody);
        } else {
          // 其他内容原样返回
          res.end(body);
        }
      } catch (err) {
        console.error("注入处理异常", err);
        res.end(Buffer.concat(chunks));
      }
    });
  }

  /**
   * 生成导入脚本的 HTML
   * @param scriptDir 脚本文件夹路径
   * @returns 脚本标签 HTML
   */
  private generateImportScripts(scriptDir: string): string {
    const fullPath = path.resolve(scriptDir);

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
      devServerLogger.warn(`注入脚本目录不存在: ${fullPath}`);
      return "";
    }

    const files = fs.readdirSync(fullPath);
    const jsFiles = files
      .filter((file) => file.endsWith(".js") && !file.startsWith("#"))
      .sort();

    if (jsFiles.length === 0) {
      devServerLogger.warn(`注入脚本目录没有 js 文件: ${fullPath}`);
      return "";
    }

    const importStatements = jsFiles
      .map((file) =>`<script type="module" src="/envm-inject/${file}"></script>`)
      .join("\n");

    return importStatements;
  }

  /**
   * 启动服务
   * @param envItem
   * @returns
   */
  async startServer() {
    const { port } = this.getEnvItem();
    if (PreProxyServer.appMap[this.envId]) {
      devServerLogger.info(`环境 ${this.envId} 已经启动`);
      return;
    }

    this.server = await new Promise((resolve, reject) => {
      const server = this.app.listen(port, () => {
        devServerLogger.info(`Server is running on http://localhost:${port}`);
        resolve(server);
      });
      server.on("error", (err) => {
        console.error(`端口 ${port} 启动失败:`, err.message);
        reject(err);
      });
    });

    this.sockets = new Set();
    this.server.on("connection", (socket) => {
      this.sockets.add(socket);
      socket.setTimeout(300000);
      socket.on("timeout", () => {
        socket.destroy();
        this.sockets.delete(socket);
      });
      socket.on("close", () => {
        this.sockets.delete(socket);
      });
    });
  }

  static stopServer(id: string) {
    return new Promise((resolve) => {
      if (!this.getAppInsByPort(id as string)) {
        devServerLogger.info(`端口 【${id}】 未启动，无需停止！`);
        resolve(1);
        return;
      }

      for (const socket of this.appMap[id].sockets) {
        socket.destroy();
      }

      this.appMap[id].server.close((err) => {
        if (err) {
          console.error("服务器关闭失败：", err);
          resolve(0);
        } else {
          delete this.appMap[id];
          devServerLogger.info({ id }, `Server on port ${id} 已关闭`);
          resolve(1);
        }
      });
    });
  }
}

export default PreProxyServer;
