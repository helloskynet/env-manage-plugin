import { NextFunction, Request, Response } from "express";
import { DevServerService } from "../service/DevServerService";

class DevServerController {
  constructor(private readonly devserverService: DevServerService) {}

  /**
   * 处理获取开发服务器列表
   * @param req
   * @param res
   * @returns
   */
  handleGetDevServerList(req: Request, res: Response, next: NextFunction) {
    try {
      const list = this.devserverService.handleGetDevServerList();
      res.success({ list });
    } catch (error) {
      next(error);
    }
  }
}

export { DevServerController };
