import { DevServerRepoInterface } from "../repositories/DevServerRepo.js";

/**
 *
 */
class DevServerService {
  constructor(private envRepo: DevServerRepoInterface) {}

  /**
   * 处理获取开发服务器列表
   * @returns
   */
  handleGetDevServerList() {
    const list = Array.from(this.envRepo.getAll());
    return list;
  }
}

export { DevServerService };
