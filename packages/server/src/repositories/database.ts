import loki from "lokijs";
import { DevServerModel, EnvModel } from "../types/index.js";
import { logger } from "../utils/logger.js";

// 声明数据库实例类型（避免全局变量类型模糊）
let db: loki | null = null;

/**
 * 数据库初始化配置（可抽离为外部配置文件）
 */
const DB_CONFIG = {
  filename: ".envm.data.json",
  autosave: true,
  autosaveInterval: 5000, // 注意：5秒，需统一
  autoload: true,
};

/**
 * 初始化开发环境集合
 */
const initEnvmsCollection = (db: loki) => {
  if (!db.getCollection<EnvModel>("envms")) {
    db.addCollection<EnvModel>("envms", {
      indices: ["apiBaseUrl", "id"],
      unique: ["apiBaseUrl"],
    });
  }
};

/**
 * 初始化开发服务器集合
 */
const initDevServerCollection = (db: loki) => {
  if (!db.getCollection<DevServerModel>("devServer")) {
    db.addCollection<DevServerModel>("devServer", {
      indices: ["id", "devServerUrl"],
      unique: ["devServerUrl"],
    });
  }
};

/**
 * 手动启动数据库（核心函数）
 * @returns 数据库实例（确保单例）
 */
export const startDatabase = (): Promise<loki> => {
  // 1. 单例保护：避免重复创建实例
  if (db) return Promise.resolve(db);

  // 2. 返回Promise，支持异步等待和错误捕获
  return new Promise((resolve, reject) => {
    // 3. 初始化数据库
    const newDb = new loki(DB_CONFIG.filename, {
      ...DB_CONFIG,
      // 4. 加载回调中处理集合初始化
      autoloadCallback: (err: Error | null) => {
        if (err) {
          reject(new Error(`数据库加载失败: ${err.message}`));
          return;
        }

        // 初始化集合
        initEnvmsCollection(newDb);
        initDevServerCollection(newDb);

        // 5. 赋值单例并返回
        db = newDb;
        logger.info("数据库已加载/初始化");
        resolve(newDb);
      },
    });
  });
};

/**
 * 获取数据库实例（需在startDatabase后调用）
 */
export const getDatabase = (): loki => {
  if (!db) throw new Error("数据库未启动，请先调用 startDatabase()");
  return db;
};