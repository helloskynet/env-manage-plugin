import { NextFunction, Request, Response } from "express";
import { RouteRuleService } from "../service/RouteRuleService.js";
import { RouteRuleCreate, RouteRuleDelete, RouteRuleUpdate } from "../types/index.js";
import { envLogger } from "../utils/logger.js";

/**
 * 路由规则控制器
 * 负责处理与路由规则相关的HTTP请求，作为请求入口层：
 * - 解析并验证请求参数
 * - 调用对应的服务层方法处理业务逻辑
 * - 格式化并返回响应结果
 * - 统一错误处理
 */
class RouteRuleController {
  /**
   * 构造函数 - 注入路由规则服务实例
   * @param private readonly routeRuleService - 路由规则服务实例，处理核心业务逻辑
   */
  constructor(private readonly routeRuleService: RouteRuleService) {}

  /**
   * 获取指定环境的路由规则列表
   * @description 处理查询指定环境所有路由规则的GET请求
   * @param req - Express请求对象，包含环境ID（在params中）
   * @param res - Express响应对象，用于返回路由规则列表
   * @param next - Express下一步中间件函数，用于错误处理
   */
  handleGetList(req: Request, res: Response, next: NextFunction): void {
    try {
      const envId = req.params.envId;
      envLogger.info({ envId }, "接收路由规则列表查询请求");

      // 调用服务层获取数据
      const list = this.routeRuleService.handleGetByEnvId(envId);

      // 返回成功响应（包含列表数据）
      res.success({ list, total: list.length });
    } catch (error) {
      envLogger.error(error, "路由规则列表查询请求处理失败");
      next(error);
    }
  }

  /**
   * 新增路由规则
   * @description 处理创建新路由规则的POST请求
   * @param req - Express请求对象，包含待创建的路由规则数据（在req.dto中）
   * @param res - Express响应对象，用于返回处理结果
   * @param next - Express下一步中间件函数，用于错误处理
   */
  handleAdd(req: Request, res: Response, next: NextFunction): void {
    try {
      // 验证请求数据
      const routeRuleData = req.dto as RouteRuleCreate;
      envLogger.info({ routeRuleData }, "接收新增路由规则请求");

      // 调用服务层处理业务
      const newRule = this.routeRuleService.handleAdd(routeRuleData);

      // 返回成功响应
      res.success({ message: "路由规则添加成功", data: newRule });
    } catch (error) {
      envLogger.error(error, "新增路由规则请求处理失败");
      next(error);
    }
  }

  /**
   * 更新路由规则
   * @description 处理更新路由规则的POST/PUT请求
   * @param req - Express请求对象，包含待更新的路由规则数据（在req.dto中）
   * @param res - Express响应对象，用于返回处理结果
   * @param next - Express下一步中间件函数，用于错误处理
   */
  handleUpdate(req: Request, res: Response, next: NextFunction): void {
    try {
      // 验证请求数据
      const routeRuleData = req.dto as RouteRuleUpdate;
      envLogger.info({ routeRuleData }, "接收更新路由规则请求");

      // 调用服务层处理业务
      const updatedRule = this.routeRuleService.handleUpdate(routeRuleData);

      // 返回成功响应
      res.success({ message: "路由规则更新成功", data: updatedRule });
    } catch (error) {
      envLogger.error(error, "更新路由规则请求处理失败");
      next(error);
    }
  }

  /**
   * 删除路由规则
   * @description 处理删除路由规则的POST/DELETE请求
   * @param req - Express请求对象，包含待删除路由规则的ID（在req.dto中）
   * @param res - Express响应对象，用于返回处理结果
   * @param next - Express下一步中间件函数，用于错误处理
   */
  handleDelete(req: Request, res: Response, next: NextFunction): void {
    try {
      // 验证请求数据
      const routeRuleData = req.dto as RouteRuleDelete;
      envLogger.info({ routeRuleData }, "接收删除路由规则请求");

      // 调用服务层处理业务
      this.routeRuleService.handleDelete(routeRuleData);

      // 返回成功响应
      res.success({ message: "路由规则删除成功" });
    } catch (error) {
      envLogger.error(error, "删除路由规则请求处理失败");
      next(error);
    }
  }
}

export { RouteRuleController };