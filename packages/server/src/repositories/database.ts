import loki from "lokijs";
import { DevServerModel, EnvModel } from "../types";

export const db = new loki(".envm.data.json", {
  autosave: true,
  autosaveInterval: 5000, // Save every second
  autoload: true, // 自动加载数据库
  autoloadCallback: loadHandler, // 加载完成回调
});

/**
 * 初始化开发环境集合
 */
const getEnvmsCollection = () => {
  const envms = db.getCollection<EnvModel>("envms");
  if (!envms) {
    db.addCollection<EnvModel>("envms", {
      indices: ["apiBaseUrl", "id"],
      unique: ["apiBaseUrl"],
    });
  }
};

/**
 * 初始化开发服务器集合
 */
const getDevServerCollection = () => {
  const devServer = db.getCollection<DevServerModel>("devServer");

  if (!devServer) {
    db.addCollection<DevServerModel>("devServer", {
      indices: ["id", "devServerUrl"],
      unique: ["devServerUrl"],
    });
  }
};

// 加载完成后初始化集合
function loadHandler() {
  getEnvmsCollection();
  getDevServerCollection();
  console.log("数据库已加载/初始化");
}
