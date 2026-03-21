import { NextFunction, Request, Response } from "express";
import { PasswordService } from "../service/PasswordService.js";
import { PasswordCreate, PasswordDelete, PasswordUpdate } from "../types/index.js";
import { envLogger } from "../utils/logger.js";

/**
 * 密码控制器
 * 负责处理与密码相关的HTTP请求，作为请求入口层：
 * - 解析并验证请求参数
 * - 调用对应的服务层方法处理业务逻辑
 * - 格式化并返回响应结果
 * - 统一错误处理
 */
class PasswordController {
  /**
   * 构造函数 - 注入密码服务实例
   * @param private readonly passwordService - 密码服务实例，处理核心业务逻辑
   */
  constructor(private readonly passwordService: PasswordService) {}

  /**
   * 获取指定环境的密码列表
   * @description 处理查询指定环境所有密码的GET请求
   * @param req - Express请求对象，包含环境ID（在params中）
   * @param res - Express响应对象，用于返回密码列表
   * @param next - Express下一步中间件函数，用于错误处理
   */
  handleGetList(req: Request, res: Response, next: NextFunction): void {
    try {
      const envId = req.params.envId;
      envLogger.info({ envId }, "接收密码列表查询请求");

      // 调用服务层获取数据
      const list = this.passwordService.handleGetByEnvId(envId);

      // 返回成功响应（包含列表数据）
      res.success({ list, total: list.length });
    } catch (error) {
      envLogger.error(error, "密码列表查询请求处理失败");
      next(error);
    }
  }

  /**
   * 新增密码
   * @description 处理创建新密码的POST请求
   * @param req - Express请求对象，包含待创建的密码数据（在req.dto中）
   * @param res - Express响应对象，用于返回处理结果
   * @param next - Express下一步中间件函数，用于错误处理
   */
  handleAdd(req: Request, res: Response, next: NextFunction): void {
    try {
      // 验证请求数据
      const passwordData = req.dto as PasswordCreate;
      envLogger.info({ passwordData: { ...passwordData, password: "***" } }, "接收新增密码请求");

      // 调用服务层处理业务
      const newPassword = this.passwordService.handleAdd(passwordData);

      // 返回成功响应
      res.success({ message: "密码添加成功", data: newPassword });
    } catch (error) {
      envLogger.error(error, "新增密码请求处理失败");
      next(error);
    }
  }

  /**
   * 更新密码
   * @description 处理更新密码的POST/PUT请求
   * @param req - Express请求对象，包含待更新的密码数据（在req.dto中）
   * @param res - Express响应对象，用于返回处理结果
   * @param next - Express下一步中间件函数，用于错误处理
   */
  handleUpdate(req: Request, res: Response, next: NextFunction): void {
    try {
      // 验证请求数据
      const passwordData = req.dto as PasswordUpdate;
      envLogger.info({ passwordData: { ...passwordData, password: "***" } }, "接收更新密码请求");

      // 调用服务层处理业务
      const updatedPassword = this.passwordService.handleUpdate(passwordData);

      // 返回成功响应
      res.success({ message: "密码更新成功", data: updatedPassword });
    } catch (error) {
      envLogger.error(error, "更新密码请求处理失败");
      next(error);
    }
  }

  /**
   * 删除密码
   * @description 处理删除密码的POST/DELETE请求
   * @param req - Express请求对象，包含待删除密码的ID（在req.dto中）
   * @param res - Express响应对象，用于返回处理结果
   * @param next - Express下一步中间件函数，用于错误处理
   */
  handleDelete(req: Request, res: Response, next: NextFunction): void {
    try {
      // 验证请求数据
      const passwordData = req.dto as PasswordDelete;
      envLogger.info({ passwordData }, "接收删除密码请求");

      // 调用服务层处理业务
      this.passwordService.handleDelete(passwordData);

      // 返回成功响应
      res.success({ message: "密码删除成功" });
    } catch (error) {
      envLogger.error(error, "删除密码请求处理失败");
      next(error);
    }
  }
}

export { PasswordController };