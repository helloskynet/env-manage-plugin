import { EnvModel } from "@envm/schemas";
import { v4 as uuidv4 } from "uuid";

class EnvItemModel implements EnvModel {
  /**
   * 主键
   */
  id: string;

  /**
   * 环境名称
   */
  name: string;

  /**
   * 环境描述
   */
  description: string;

  /**
   * 环境绑定端口
   **/
  port: number;

  /**
   * 环境绑定的开发服务器ID
   */
  devServerId: string;

  /**
   * 环境IP地址
   */
  apiBaseUrl: string;

  /**
   * 环境首页
   */
  homePage: string;

  status: "running" | "stopped" = "stopped";

  constructor(envItem: EnvModel) {
    this.id = uuidv4();
    this.name = envItem.name ?? "";
    this.description = envItem.description ?? "";
    this.port = envItem.port ?? "";
    this.apiBaseUrl = envItem.apiBaseUrl ?? "";
    this.homePage = envItem.homePage ?? "";
    this.devServerId = envItem.devServerId ?? "";
  }
}

export { EnvItemModel };
