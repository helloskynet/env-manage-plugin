declare namespace Express {
  // 直接扩展Express命名空间下的Request接口
  interface Request {
    /**
     * 接收到的入参
     */
    dto?: unknown;
  }
}
