import { EnvItemInterface } from "@envm/schemas";

class EnvItemModel implements EnvItemInterface {
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

  constructor(envItem: EnvItemInterface) {
    this.name = envItem.name ?? "";
    this.description = envItem.description ?? "";
    this.port = envItem.port ?? "";
    this.apiBaseUrl = envItem.apiBaseUrl ?? "";
    this.homePage = envItem.homePage ?? "";
    this.devServerId = envItem.devServerId ?? "";
  }
}

export { EnvItemModel };
