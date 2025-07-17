import { Request, Response } from "express";
import PreProxyServer from "../PreProxyServer.js";
import { EnvRepo } from "../repositories/EnvRepo.js";
import { EnvItemModel } from "../models/EnvModel.js";
import BaseResponse from "../dto/BaseRes.js";

/**
 * 环境服务类
 * 负责处理与环境相关的请求
 */
class EnvService {
  constructor(private envRepo: EnvRepo) {}

  /**
   * 添加环境
   * @param req
   * @param res
   * @returns {BaseResponse}
   * @throws {Error} 如果缺少必要参数或环境已存在
   */
  handleAddEnv(envItem: EnvItemModel): BaseResponse {
    console.log("添加环境", envItem);
    const existingEnv = this.envRepo.findOneByIpAndPort(envItem);
    if (!existingEnv) {
      this.envRepo.addEnv(envItem);
      return {
        code: 200,
        message: `添加成功`,
      };
    }
    console.error("添加环境失败", envItem, "已存在", existingEnv);
    return {
      code: 201,
      message: `添加失败，环境 【${existingEnv.ip}:${existingEnv.port}】 已存在`,
    };
  }

  /**
   * 删除环境
   * @param envItem 环境信息
   * @returns {void}
   * @throws {Error} 如果环境不存在
   */
  handleDeleteEnv(envItem: EnvItemModel): void {
    console.log("删除环境", envItem);
    const env = this.envRepo.findOneByIpAndPort(envItem);
    if (env) {
      this.envRepo.deleteEnv(envItem);
      console.log("删除环境成功", envItem);
    } else {
      console.error("删除环境失败", envItem, "不存在");
      throw new Error(`删除失败，环境 【${envItem}】 不存在`);
    }
  }

  /**
   * 获取环境列表
   * @returns
   */
  handleGetList() {
    const list = this.envRepo.getAll();
    return list;
  }

  /**
   * 启动代理服务器
   * @param env
   * @param res
   * @returns
   */
  async handleStartServer(env: EnvItemModel, res: Response) {
    const port = env.port;
    if (PreProxyServer.appMap[port]) {
      await PreProxyServer.stopServer(env.port);
    }
    PreProxyServer.create(env);

    return res.json({
      message: `环境 【${env.name}】 在端口 【${port}】 已启动`,
    });
  }

  /**
   * 停止代理服务器
   * @param env
   * @param res
   * @returns
   */
  handleStopServer(env: EnvItemModel, res: Response) {
    return PreProxyServer.stopServer(env.port)
      .then(() => {
        return res.json({
          message: `环境 【${env.name}】 在端口 【${env.port}】 已关闭`,
        });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: "停止服务器失败" });
      });
  }

  /**
   * 更新环境绑定的开发服务器ID
   * @param req
   * @param res
   * @returns
   */
  handleUpdateDevServerId(req: Request<unknown, unknown, EnvItemModel>) {
    const { devServerId, ip, port } = req.body;

    this.envRepo.updateDevServerId(ip, port, devServerId);

    return {
      message: `环境 【${name}】 在端口 【${port}】 已经切换到 【${devServerId}】`,
    };
  }
}

export { EnvService };
