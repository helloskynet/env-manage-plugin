// routes/index.ts
import express, { Router } from "express";
import * as libCookie from "cookie";
import { Container } from "../Container.js";
import { EnvController } from "../controllers/EnvController.js";
import { DevServerController } from "../controllers/DevServerController.js";
import { RouteRuleController } from "../controllers/RouteRuleController.js";
import { PasswordController } from "../controllers/PasswordController.js";
import { getConfig } from "../utils/ResolveConfig.js";
import { toDTO } from "../middleware/dto.middleware.js";
import {
  EnvPrimarySchema,
  EnvCreateSchema,
  EnvUpdateSchema,
  DevServerCreateSchema,
  DevServerDeleteSchema,
  DevServerUpdateSchema,
  RouteRuleCreateSchema,
  RouteRuleDeleteSchema,
  RouteRuleUpdateSchema,
  PasswordCreateSchema,
  PasswordDeleteSchema,
  PasswordUpdateSchema,
} from "../types/index.js";

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
  router.put("/update", toDTO(DevServerUpdateSchema), (...res) =>
    controller.handleUpdateDevServer(...res)
  );
  router.delete("/", toDTO(DevServerDeleteSchema), (...res) =>
    controller.handleDeleteDevServer(...res)
  );
  return router;
};

const createRouteRuleRoutes = (controller: RouteRuleController) => {
  const router = Router();
  router.get("/list/:envId", (...res) => controller.handleGetList(...res));
  router.post("/add", toDTO(RouteRuleCreateSchema), (...res) =>
    controller.handleAdd(...res)
  );
  router.post("/update", toDTO(RouteRuleUpdateSchema), (...res) =>
    controller.handleUpdate(...res)
  );
  router.post("/delete", toDTO(RouteRuleDeleteSchema), (...res) =>
    controller.handleDelete(...res)
  );
  return router;
};

const createPasswordRoutes = (controller: PasswordController) => {
  const router = Router();
  router.get("/list/:envId", (...res) => controller.handleGetList(...res));
  router.post("/add", toDTO(PasswordCreateSchema), (...res) =>
    controller.handleAdd(...res)
  );
  router.post("/update", toDTO(PasswordUpdateSchema), (...res) =>
    controller.handleUpdate(...res)
  );
  router.post("/delete", toDTO(PasswordDeleteSchema), (...res) =>
    controller.handleDelete(...res)
  );
  return router;
};

const createCommonRoutes = () => {
  const router = Router();
  router.get("/are-you-ok", (req, res) => res.success({}, "I'm ok!"));
  router.get("/clear-proxy-cookie", (req, res) => {
    const cookies = req.headers.cookie;
    if (cookies) {
      const cookieArr = libCookie.parse(cookies);
      Object.keys(cookieArr).forEach((cookieName) => {
        if (cookieName.endsWith(getConfig().cookieSuffix)) {
          res.setHeader("Set-Cookie", `${cookieName}=; max-age=0; path=/`);
        }
      });
    }
    res.success();
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
  const routeRuleController = container.get<RouteRuleController>(
    "routeRuleController"
  );
  const passwordController = container.get<PasswordController>(
    "passwordController"
  );

  // 挂载模块路由
  rootRouter.use("/env", createEnvRoutes(envController));
  rootRouter.use("/server", createDevServerRoutes(devServerController));
  rootRouter.use("/route-rule", createRouteRuleRoutes(routeRuleController));
  rootRouter.use("/password", createPasswordRoutes(passwordController));
  rootRouter.use("/", createCommonRoutes());

  return rootRouter;
};
