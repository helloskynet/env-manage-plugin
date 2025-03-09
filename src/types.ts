import { IncomingMessage } from "http";
import { Options as HttpProxyOptions } from "http-proxy-middleware";
/**
 * 开发服务器配置
 */
export type DevServerItem = {
  /**
   * 开发服务器名称，primary key
   */
  name: string;
  /**
   * 开发服务器地址
   *
   * @example
   * http://127.0.0.1:5713
   */
  target: string;
};

/**
 * 转发路由配置
 */
type RouterFunction = (
  req: IncomingMessage,
  env: EnvItem
) => Promise<HttpProxyOptions["target"]>;

/**
 * 环境配置
 */
export type EnvItem = {
  name: string;
  port: number;
  target: string;
  indexPage?: string;
  devServerName: string;
  router?: RouterFunction;
};

/**
 * 应用配置
 */
export interface EnvConfig {
  /**
   * 后置转发端口，开发服务器要转发的地址
   */
  port: number;
  /**
   * 管理页面相关接口的 基础路径，如果与业务冲突可以通过这里调整
   *
   * @default '/dev-manage-api'
   */
  basePath: string;
  /**
   * 首页地址
   */
  indexPage: string;
  /**
   * 开发服务器列表
   */
  devServerList: Array<DevServerItem>;
  /**
   * 开发环境列表
   */
  envList: Array<EnvItem>;
}

/**
 * 应用启动配置
 */
export interface Options {
  /**
   * 配置文件地址
   *
   * @default string  envm.config.[m/c]js
   */
  config?: string;
}
