import { AppError } from "../utils/errors.js";
import { db } from "./database.js";
import {
  EnvModel,
  EnvDelete,
  EnvQuery,
  EnvQuerySchema,
  EnvDeleteSchema,
  EnvUpdate,
  EnvCreate,
} from "@envm/schemas";

/**
 * 环境仓库类
 * 负责环境相关数据的持久化操作，封装了数据库交互逻辑
 */
class EnvRepo {
  /**
   * 获取环境数据集合
   * @returns 环境数据集合对象
   */
  private getCollection() {
    return db.getCollection<EnvModel>("envms");
  }

  /**
   * 构造函数
   */
  constructor() {}

  /**
   * 获取所有环境信息
   * @returns 所有环境信息的数组
   */
  getAll(): EnvModel[] {
    return this.getCollection().find();
  }

  /**
   * 添加新环境
   * @param env - 要添加的环境完整信息对象
   */
  addEnv(env: EnvModel) {
    this.getCollection().insert(env);
  }

  /**
   * 删除指定环境
   * @param env - 包含要删除环境ID的对象
   * @throws {Error} 当验证失败或删除操作出现问题时抛出错误
   */
  deleteEnv(env: EnvDelete) {
    const target = EnvDeleteSchema.safeParse(env);
    if (!target.success) {
      throw new AppError(`删除环境验证失败: ${JSON.stringify(target.error)}`);
    }
    this.getCollection().findAndRemove(target.data);
  }

  /**
   * 根据ID查询环境信息
   * @param env - 包含要查询环境ID的对象
   * @returns 匹配的环境信息对象，若未找到则返回null
   * @throws {Error} 当验证失败时抛出错误
   */
  findOneById(env: EnvQuery) {
    const target = EnvQuerySchema.safeParse(env);
    if (!target.success) {
      throw new AppError(`查询环境验证失败: ${JSON.stringify(target.error)}`);
    }
    return this.getCollection().findOne(target.data);
  }

  /**
   * 根据 apiBaseUrl 环境信息查找单个环境 新增前用于判断是否重复
   * @param env 环境信息
   * @returns 匹配的环境信息或 undefined
   */
  findOneByApiBaseUrl(env: EnvCreate) {
    return this.getCollection().findOne({
      apiBaseUrl: env.apiBaseUrl,
    });
  }

    /**
   * 根据状态和端口查询
   * @param env
   * @returns
   */
  findOneByPortAndStatus(env: Pick<EnvModel, "port" | "status">) {
    return this.getCollection().findOne({
      port: env.port,
      status: env.status,
    });
  }

  /**
   * 更新环境信息
   * @param envmItem - 包含要更新的环境ID及字段的对象
   * @throws {AppError} 当未找到对应环境时抛出异常
   * @throws {Error} 当更新操作出现问题时抛出错误
   */
  update(envmItem: EnvUpdate) {
    this.getCollection().findAndUpdate({ id: envmItem.id }, (env) => {
      if (!env) {
        throw new AppError("未找到对应的环境");
      }
      Object.assign(env, envmItem);
      return env;
    });
  }
}

export { EnvRepo };
