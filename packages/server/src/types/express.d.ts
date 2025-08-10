declare namespace Express {
  // 直接扩展Express命名空间下的Request接口
  interface Request {
    /**
     * 接收到的入参
     */
    dto?: unknown;
  }

  interface Response {
    /**
     * 发送成功响应
     * @param data 响应数据
     * @param message 成功消息
     * @param code 状态码（默认 200）
     */
    success: <T = unknown>(data?: T, message?: string, code?: number) => this;

    /**
     * 发送错误响应
     * @param message 错误消息
     * @param code 状态码（默认 500）
     * @param data 附加错误数据
     */
    error: <T = unknown>(message?: string, code?: number, data?: T) => this;
  }
}
