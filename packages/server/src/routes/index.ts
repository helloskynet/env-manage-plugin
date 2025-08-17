// routes/index.ts
import express, { Router } from "express";
import * as libCookie from "cookie";
import { Container } from "../Container.js";
import { EnvController } from "../controllers/EnvController.js";
import { DevServerController } from "../controllers/DevServerController.js";
import { config } from "../utils/ResolveConfig.js";
import { toDTO } from "../middleware/dto.middleware";
import {
  EnvPrimarySchema,
  EnvCreateSchema,
  EnvUpdateSchema,
  DevServerCreateSchema,
} from "../types";

// 1. 创建各模块路由
const createEnvRoutes = (controller: EnvController) => {
  const router = Router();
  router.get("/getlist", (...res) => controller.handleGetList(...res));
  router.post("/add", toDTO(EnvCreateSchema), (...res) =>
    controller.handleAddEnv(...res)
  );
  router.post("/delete", toDTO(EnvPrimarySchema), (...res) =>
    controller.handleDeleteEnv(...res)
  );
  router.post("/update", toDTO(EnvUpdateSchema), (...res) =>
    controller.handleUpdateEnv(...res)
  );
  router.post("/start", toDTO(EnvPrimarySchema), (...res) =>
    controller.handleStartServer(...res)
  );
  router.post("/stop", toDTO(EnvPrimarySchema), (...res) =>
    controller.handleStopServer(...res)
  );
  return router;
};

const createDevServerRoutes = (controller: DevServerController) => {
  const router = Router();
  router.get("/list", (...res) => controller.handleGetDevServerList(...res));
  router.post("/add", toDTO(DevServerCreateSchema), (...res) =>
    controller.handleCreateDevServer(...res)
  );
  return router;
};

const createCommonRoutes = () => {
  const router = Router();
  router.get("/are-you-ok", (req, res) => res.json({ message: "I'm ok!" }));
  router.get("/clear-proxy-cookie", (req, res) => {
    const cookies = req.headers.cookie;
    if (cookies) {
      const cookieArr = libCookie.parse(cookies);
      Object.keys(cookieArr).forEach((cookieName) => {
        if (cookieName.endsWith(config.cookieSuffix)) {
          res.appendHeader("Set-Cookie", `${cookieName}=; max-age=0; path=/`);
        }
      });
    }
    res.json({ message: "Prefixed cookies cleared successfully." });
  });
  return router;
};

// 2. 整合所有路由并导出
export const createRouter = (): Router => {
  const rootRouter = Router();

  // 全局中间件（原 ManageRouter 中的通用中间件）
  rootRouter.use(express.json());

  // 依赖注入
  const container = Container.getInstance();
  const envController = container.get<EnvController>("envController");
  const devServerController = container.get<DevServerController>(
    "devServerController"
  );

  // 挂载模块路由
  rootRouter.use("/env", createEnvRoutes(envController));
  rootRouter.use("/server", createDevServerRoutes(devServerController));
  rootRouter.use("/", createCommonRoutes());

  return rootRouter;
};
