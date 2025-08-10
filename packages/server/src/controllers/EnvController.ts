import { NextFunction, Request, Response } from "express";
import { EnvService } from "../service/EnvService";
import { EnvBaseInterface, EnvItemInterface } from "envm";

/**
 * 开发环境控制器
 * 负责处理与开发环境相关的请求
 * 控制器应专注于
 *  请求参数解析
 *  路由处理
 *  响应格式化
 *  权限验证等流程控制
 * Controller：作为请求入口，负责 “接收请求→调用服务→返回响应” 的流程编排，不包含具体业务逻辑。
 */
class EnvController {
  constructor(private readonly envService: EnvService) {}

  /**
   * 新增环境
   * @description 处理添加新环境的请求
   * @param req
   * @param res
   * @param next
   * @returns
   */
  handleAddEnv(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("添加环境-------------", req.dto, "lll");
      const envItem = req.dto as EnvItemInterface;
      this.envService.handleAddEnv(envItem);
      res.success();
    } catch (error) {
      next(error);
    }
  }

  handleDeleteEnv(req: Request, res: Response, next: NextFunction) {
    try {
      console.log(req.dto, "req.body");
      const envItem = req.dto as EnvBaseInterface;
      this.envService.handleDeleteEnv(envItem);
      res.success();
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取环境列表
   * @param req
   * @param res
   * @returns
   */
  handleGetList(req: Request, res: Response, next: NextFunction) {
    try {
      const list = this.envService.handleGetList();
      res.success({ list });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 启动代理服务器
   * @param req
   * @param res
   * @param next
   * @returns
   */
  async handleStartServer(req: Request, res: Response, next: NextFunction) {
    try {
      console.log(req.dto, "req.body--------------");
      const envItem = req.dto as EnvBaseInterface;
      await this.envService.handleStartServer(envItem);
      res.success();
    } catch (error) {
      next(error);
    }
  }

  /**
   * 停止代理服务器
   * @param req
   * @param res
   * @param next
   * @returns
   */
  async handleStopServer(
    req: Request<unknown, unknown, EnvItemInterface>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const env: EnvItemInterface = req.body;
      await this.envService.handleStopServer(env, res);
      res.success();
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新环境绑定的开发服务器ID
   * @param req
   * @param res
   * @returns
   */
  handleUpdateDevServerId(req: Request, res: Response, next: NextFunction) {
    try {
      const { devServerName, name, port } = req.body;

      if (!devServerName || !name || !port) {
        return res.status(400).json({
          error: "缺少 devServerName 或 name 或者 port 参数",
        });
      }
      const list = this.envService.handleUpdateDevServerId(req);
      res.success({ list });
    } catch (error) {
      next(error);
    }
  }
}

export { EnvController as EnvController };
