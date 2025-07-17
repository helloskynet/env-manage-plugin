import { EnvItemInterface } from '../../types/env';

class EnvItemModel implements EnvItemInterface {

  /**
   * 环境名称
   */
  name: string;

  /**
   * 环境描述
   */
  description?: string;

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
  ip: string;

  /**
   * 环境首页
   */
  homePage?: string;

  /**
   * 环境状态
   */
  status: 'running' | 'stopped';
  
}

export { EnvItemModel };