import loki, { Collection } from "lokijs";
import { DevServerModel } from "../models/DevServerModel";
import { EnvItemInterface } from "@envm/schemas";
import { DevServerInterface } from "@envm/schemas";

export const db = new loki(".envm.data.json", {
  autosave: true,
  autosaveInterval: 5000, // Save every second
  autoload: true, // 自动加载数据库
  autoloadCallback: loadHandler, // 加载完成回调
});

/**
 * 为 LokiJS 集合创建自增主键生成器
 * @param {Collection} collection - LokiJS 集合实例
 * @param {string} [idField='id'] - 主键字段名，默认为 'id'
 */
function setupAutoIncrement(collection: Collection, idField = "id") {
  // 获取当前最大 ID
  let nextId = 1;
  const docs = collection.data;

  if (docs.length > 0) {
    // 从现有文档中找到最大 ID
    const maxId = Math.max(...docs.map((doc) => doc[idField]));
    nextId = maxId + 1;
  }

  // 保存自增 ID 的函数
  function getNextId() {
    return nextId++;
  }

  // 重写集合的 insert 方法
  const originalInsert = collection.insert.bind(collection);

  collection.insert = function (docOrDocs) {
    if (Array.isArray(docOrDocs)) {
      // 处理批量插入
      return originalInsert(
        docOrDocs.map((doc) => {
          doc[idField] = getNextId();
          return doc;
        })
      );
    } else {
      // 处理单个插入
      docOrDocs[idField] = getNextId();
      return originalInsert(docOrDocs);
    }
  };

  return collection;
}

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
  const devServer = db.getCollection<DevServerInterface>("devServer");

  if (!devServer) {
    const devServerColection = db.addCollection<DevServerModel>("devServer", {
      indices: ["id"],
      unique: ["id"],
    });
    setupAutoIncrement(devServerColection);
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
