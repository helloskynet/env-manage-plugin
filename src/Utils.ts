import * as fs from "fs";
import * as path from "path";
import portfinder from "portfinder";
import { KeyObj } from "./types";

class Utils {
  /**
   * 去除具有相同 name 和 port 组合的环境配置重复项
   * @param {Array} envList - 环境配置列表
   * @returns {Array} - 去重后的环境配置列表
   */
  static removeEnvDuplicates = <T extends KeyObj>(envList: T[]): T[] => {
    const uniqueMap = new Map();
    const result: T[] = [];

    envList.forEach((item) => {
      const rowKey = Utils.getRowKey(item);
      if (!uniqueMap.has(rowKey)) {
        uniqueMap.set(rowKey, true);
        result.push(item);
      }
    });

    return result;
  };

  /**
   * 转化列表为 Map
   * @param {*} list
   * @param {*} keys
   * @returns
   */
  static generateMap<T extends KeyObj>(
    // 传入的数组，元素类型为 T
    list: T[]
  ) {
    // 使用 reduce 方法将数组元素存入对象
    return list.reduce((map, item: T) => {
      const key = Utils.getRowKey(item);
      map.set(key, item);
      return map;
    }, new Map());
  }

  static isESModuleByPackageJson() {
    const packageJsonPath = path.resolve(process.cwd(), "package.json");

    if (fs.existsSync(packageJsonPath)) {
      return import(packageJsonPath)
        .then((packageJson) => {
          if (Object.hasOwnProperty.call(packageJson.default, "type")) {
            return packageJson.default.type === "module";
          }
          return false;
        })
        .catch(() => {
          return false;
        });
    }

    return Promise.resolve(false);
  }

  static isESModule(filepath: string) {
    const ext = path.extname(filepath);
    // 检查文件扩展名
    if (ext === ".mjs") {
      return true;
    } else if (ext === ".cjs") {
      return false;
    } else if (ext === ".js") {
      // 查找最近的 package.json 文件
      let currentDir = path.dirname(filepath);
      while (currentDir) {
        const packageJsonPath = path.join(currentDir, "package.json");
        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(
              fs.readFileSync(packageJsonPath, "utf8")
            );
            if (packageJson.type === "module") {
              return true;
            } else {
              return false;
            }
          } catch (error) {
            break;
          }
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
          break;
        }
        currentDir = parentDir;
      }
      // 如果没有找到 package.json，默认使用 CommonJS
      return false;
    }
    // 对于其他扩展名，默认使用 CommonJS
    return false;
  }

  static getRowKey<T extends KeyObj>(rowData: T) {
    return `${rowData?.name ?? ""}+${rowData?.port ?? ""}`;
  }

  /**
   * 查询指定端口是否被占用
   * @param port
   * @returns
   */
  static isPortOccupied(port: number) {
    return portfinder
      .getPortPromise({
        port: port,
        stopPort: port,
      })
      .then(() => {
        return false;
      })
      .catch(() => {
        return true;
      });
  }
}

export default Utils;
