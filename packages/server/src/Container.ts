import { EnvController } from "./controllers/EnvController";
import { DevServerController } from "./controllers/DevServerController";
import { EnvRepo } from "./repositories/EnvRepo.js";
import { EnvService } from "./service/EnvService";
import { DevServerService } from "./service/DevServerService";
import { DevServerRepo } from "./repositories/DevServerRepo";
import { ProxyAutoStarter } from "./service/ProxyAutoStarterService";

class Container {
  private static instance: Container;
  private dependencies: Map<string, unknown> = new Map();

  private constructor() {
    // 环境和服务的注册
    const envRepo = new EnvRepo();
    const devServerRepo = new DevServerRepo();
    // configIns.initConfig();
    this.register("envService", new EnvService(envRepo, devServerRepo));
    this.register("envController", new EnvController(this.get("envService")));
    // 开发服务器服务和控制器的注册
    this.register(
      "devServerService",
      new DevServerService(devServerRepo, envRepo)
    );
    this.register(
      "devServerController",
      new DevServerController(this.get("devServerService"))
    );
    setTimeout(() => {
      new ProxyAutoStarter(envRepo, this.get("envService"));
    }, 5000);
  }

  static getInstance(): Container {
    if (!this.instance) {
      this.instance = new Container();
    }
    return this.instance;
  }

  register<T>(key: string, value: T): this {
    this.dependencies.set(key, value);
    return this;
  }

  get<T>(key: string): T {
    if (!this.dependencies.has(key)) {
      throw new Error(`Dependency ${key} not found`);
    }
    return this.dependencies.get(key) as T;
  }
}

export { Container };
