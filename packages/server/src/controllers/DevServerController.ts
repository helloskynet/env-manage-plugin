import { NextFunction, Request, Response } from "express";
import { DevServerService } from "../service/DevServerService";
import { CreateDevServerSchema, BaseDevServerSchema } from "@envm/schemas";

class DevServerController {
  constructor(private readonly devServerService: DevServerService) {}

  /**
   * 处理获取开发服务器列表
   * @param req
   * @param res
   * @param next
   * @returns
   */
  handleGetDevServerList(req: Request, res: Response, next: NextFunction) {
    try {
      const list = this.devServerService.getDevServerList();
      res.success({ list });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 处理获取单个开发服务器详情
   * @param req
   * @param res
   * @param next
   * @returns
   */
  handleGetDevServerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const server = this.devServerService.getDevServerById(id);

      if (!server) {
        return res.error("开发服务器不存在");
      }

      res.success({ server });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 处理创建开发服务器
   * @param req
   * @param res
   * @param next
   * @returns
   */
  handleCreateDevServer(req: Request, res: Response, next: NextFunction) {
    try {
      // 验证请求体
      const validatedData = CreateDevServerSchema.parse(req.body);

      this.devServerService.createDevServer(validatedData);
      res.success("开发服务器创建成功");
    } catch (error) {
      next(error);
    }
  }

  /**
   * 处理更新开发服务器
   * @param req
   * @param res
   * @param next
   * @returns
   */
  handleUpdateDevServer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = BaseDevServerSchema.partial().parse(req.body);

      const updatedServer = this.devServerService.updateDevServer(
        id,
        updateData
      );

      if (!updatedServer) {
        return res.error("开发服务器不存在");
      }

      res.success({ message: "开发服务器更新成功", server: updatedServer });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 处理删除开发服务器
   * @param req
   * @param res
   * @param next
   * @returns
   */
  handleDeleteDevServer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = this.devServerService.deleteDevServer(id);

      if (!result) {
        return res.error("开发服务器不存在");
      }

      res.success({ message: "开发服务器删除成功" });
    } catch (error) {
      next(error);
    }
  }
}

export { DevServerController };
