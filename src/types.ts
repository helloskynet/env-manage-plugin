import { IncomingMessage } from "http";
import { Options as HttpProxyOptions } from "http-proxy-middleware";

/**
 * 开发服务器配置项
 */
export type DevServerItem = {
  /**
   * 开发服务器的唯一标识名称，作为主键使用
   */
  name: string;
  /**
   * 开发服务器的地址，指定了开发服务器的访问路径
   *
   * @example
   * ```txt
   * http://127.0.0.1:5173
   * ```
   */
  target: string;
};

/**
 * 环境配置项
 */
export type EnvItem = {
  /**
   * 环境的唯一标识名称，作为主键使用
   */
  name: string;
  /**
   * 本地启动后前端服务所在的端口号。
   *
   * 当多个环境共用一个端口时，各个服务会自动互斥。
   */
  port: number;
  /**
   * 目标 API 服务器的地址，请求将被转发到该地址
   */
  target: string;
  /**
   * 当前环境的首页地址，会覆盖全局配置中的首页地址。
   *
   * @default '/'
   */
  indexPage?: string;
  /**
   * 当前环境使用的开发服务器名称。
   *
   * 若未提供，则默认使用开发服务器列表 {@link EnvConfig.devServerList `Config.devServerList` } 中的第一个。
   */
  devServerName?: string;
  /**
   * 路由转发函数，用于根据请求和当前环境信息动态确定转发目标。
   *
   * 提供了此配置之后，会覆盖 {@link EnvItem.target `EnvItem.target`}
   *
   * 规则同 {@link https://www.npmjs.com/package/http-proxy-middleware#router-objectfunction `http-proxy-middleware router`}，
   * 但不支持对象形式，且增加了第二个参数用于传递当前环境相关信息。
   *
   *
   * @example
   * ```js
   * ...
   *   router: async (req, env) => {
   *     return 'http://127.0.0.1:3000';
   *   }
   * ...
   * ```
   */
  router?: RouterFunction;
};

/**
 * 转发路由配置函数类型
 *
 * @param {IncomingMessage} req - HTTP 请求对象，包含了客户端发送的请求信息，如请求方法、请求头、请求路径等。
 * @param {EnvItem} env - 当前环境的配置项，包含了环境名称、端口、目标 API 服务器地址等信息。
 * @returns {Promise<HttpProxyOptions["target"]>} - 返回一个 Promise，该 Promise 解析为代理目标的地址，用于指定请求要转发到的目标服务器。
 */
type RouterFunction = (
  req: IncomingMessage,
  env: EnvItem
) => Promise<HttpProxyOptions["target"]>;

/**
 * 应用配置
 */
export interface EnvConfig {
  /**
   * 后置转发端口，开发服务器将请求转发到该端口对应的地址。
   *
   * @default 3099
   */
  port: number;
  /**
   * 管理页面相关接口的基础路径。
   *
   * 若与业务路径冲突，可通过此配置进行调整。
   *
   * @default '/dev-manage-api'
   */
  basePath: string;
  /**
   * 应用的首页地址。
   *
   * @default '/'
   */
  indexPage: string;
  /**
   * 开发服务器列表，包含多个开发服务器的配置信息
   */
  devServerList: Array<DevServerItem>;
  /**
   * 开发环境列表，包含多个开发环境的配置信息
   */
  envList: Array<EnvItem>;
}

/**
 * 应用启动配置
 */
export interface Options {
  /**
   * 配置文件的地址，指定了应用启动时加载的配置文件路径。
   *
   * @default 'envm.config.[m/c]js'
   */
  config?: string;
}
