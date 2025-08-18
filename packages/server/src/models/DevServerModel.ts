import { DevServerModel } from "../types/index.js";

interface DevServerItemModel extends DevServerModel{
  /**
   * 开发服务器的ID
   */
  id: string;

  /**
   * 开发服务器的名称
   */
  name: string;

  /**
   * 开发服务器的描述
   */
  description: string;

  /**
   * 开发服务器的IP地址
   */
  devServerUrl: string;
  
}

export { DevServerItemModel };