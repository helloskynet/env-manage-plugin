import loki from "lokijs";
import { DevServerModel } from "../models/DevServerModel";
import { CreateDevServerInterface, EnvItemInterface } from "@envm/schemas";

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
  const envms = db.getCollection<EnvItemInterface>("envms");
  if (!envms) {
    db.addCollection<EnvItemInterface>("envms", {
      indices: ["ip", "port"],
    });
  }
};

/**
 * 初始化开发服务器集合
 */
const getDevServerCollection = () => {
  const devServer = db.getCollection<CreateDevServerInterface>("devServer");

  if (!devServer) {
    db.addCollection<DevServerModel>("devServer", {
      indices: ["ip", "port"],
      unique: ["id"],
    });
  }
};

// 加载完成后初始化集合
function loadHandler() {
  getEnvmsCollection();
  getDevServerCollection();
  console.log("数据库已加载/初始化");
}

// 确保集合存在的辅助函数
export function getEnvmCollection() {
  let envms = db.getCollection<EnvItemInterface>("envms");

  if (!envms) {
    envms = db.addCollection<EnvItemInterface>("envms", {
      indices: ["ip", "port"],
      unique: ["ip", "port"],
    });
  }

  return envms;
}
