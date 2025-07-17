/**
 * 开发服务器
 */
export interface DevServerInterface {
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
   * 开发服务器的端口
   */
  port: number;

  /**
   * 开发服务器的IP地址
   */
  ip: string;

  
}
