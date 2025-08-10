import { db } from "./database.js";
import { EnvBaseInterface, EnvBaseSchema, EnvItemInterface } from "envm";

export interface EnvRepoInterface {
  getAll(): EnvItemInterface[];
}

class EnvRepo implements EnvRepoInterface {
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
    const envms = db.getCollection<EnvItemInterface>("envms");
    const list = envms.find();
    return list;
  }

  /**
   * 新增环境
   */
  addEnv(env: EnvItemInterface) {
    const envms = db.getCollection<EnvItemInterface>("envms");
    envms.insert(env);
  }

  /**
   * 删除环境
   * @param env 环境信息
   * @returns 匹配的环境信息或 undefined
   */
  deleteEnv(env: EnvBaseInterface) {
    const envms = db.getCollection<EnvItemInterface>("envms");
    const target = EnvBaseSchema.safeParse(env)
    envms.findAndRemove(target.data);
  }

  /**
   * 根据环境信息查找单个环境
   * @param env 环境信息
   * @returns 匹配的环境信息或 undefined
   */
  findOneByIpAndPort(env: EnvBaseInterface) {
    const envms = db.getCollection<EnvItemInterface>("envms");
    const target = EnvBaseSchema.safeParse(env)
    return envms.findOne(target.data);
  }

  /**
   * 更新环境绑定的开发服务器ID
   */
  updateDevServerId(ip: string, port: number, devServerId: string) {
    const envms = db.getCollection<EnvItemInterface>("envms");
    envms.findAndUpdate({ ip, port }, (env) => {
      if (!env) {
        throw new Error("未找到对应的环境");
      }
      env.devServerId = devServerId;
      return env;
    });
  }
}

export { EnvRepo };
