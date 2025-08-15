import { AppError } from "../utils/errors.js";
import { db } from "./database.js";
import {
  EnvBaseInterface,
  EnvBaseSchema,
  EnvItemInterface,
  EnvItemPartial,
} from "@envm/schemas";

export interface EnvRepoInterface {
  getAll(): EnvItemInterface[];
}

class EnvRepo implements EnvRepoInterface {
  /**
   * 获取环境集合的私有方法，减少重复代码
   */
  private getCollection() {
    return db.getCollection<EnvItemInterface>("envms");
  }
  /**
   *
   * @returns
   */
  constructor() {}

  /**
   * 获取所有环境信息
   * @returns 环境信息列表
   */
  getAll() {
    return this.getCollection().find();
  }

  /**
   * 新增环境
   */
  addEnv(env: EnvItemInterface) {
    this.getCollection().insert(env);
  }

  /**
   * 删除环境
   * @param env 环境信息
   * @returns 匹配的环境信息或 undefined
   */
  deleteEnv(env: EnvBaseInterface) {
    const target = EnvBaseSchema.safeParse(env);
    this.getCollection().findAndRemove(target.data);
  }

  /**
   * 根据环境信息查找单个环境
   * @param env 环境信息
   * @returns 匹配的环境信息或 undefined
   */
  findOneByIpAndPort(env: EnvBaseInterface) {
    const target = EnvBaseSchema.safeParse(env);
    return this.getCollection().findOne(target.data);
  }
  /**
   * 根据环境信息查找单个环境
   * @param env 环境信息
   * @returns 匹配的环境信息或 undefined
   */
  findOneByApiBaseUrl(env: EnvBaseInterface) {
    return this.getCollection().findOne({
      apiBaseUrl: env.apiBaseUrl,
    });
  }

  /**
   * 根据状态和端口查询
   * @param env
   * @returns
   */
  findOneByPortAndStatus(env: Pick<EnvItemInterface, "port" | "status">) {
    return this.getCollection().findOne({
      port: env.port,
      status: env.status,
    });
  }

  /**
   * 更新环境绑定的开发服务器ID
   */
  updateEnvmItem(envmItem: EnvItemPartial) {
    this.getCollection().findAndUpdate(
      { apiBaseUrl: envmItem.apiBaseUrl, port: envmItem.port },
      (env) => {
        if (!env) {
          throw new AppError("未找到对应的环境");
        }
        Object.assign(env, envmItem);
        return env;
      }
    );
  }

  /**
   *  更新
   * @param envmItem
   */
  update(envmItem: EnvItemInterface) {
    this.getCollection().update(envmItem);
  }
}

export { EnvRepo };
