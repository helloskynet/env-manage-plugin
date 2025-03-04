// 导入 path 模块
import * as path from "path";
// 导入 fs 模块
import * as fs from "fs";

class Utils {
  /**
   * 去除具有相同 name 和 port 组合的环境配置重复项
   * @param {Array} envList - 环境配置列表
   * @returns {Array} - 去重后的环境配置列表
   */
  static removeEnvDuplicates = <T extends { name: string; port?: number }>(
    envList: T[]
  ): T[] => {
    const uniqueMap = new Map();
    const result: T[] = [];

    envList.forEach((item) => {
      const key = `${item.name}-${item.port}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, true);
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
  static generateMap<T extends Record<K, any>, K extends string>(
    // 传入的数组，元素类型为 T
    list: T[],
    // keys 数组，其元素为 K 类型，默认值为 ["name", "port"]
    keys: K[] = ["name", "port"] as K[]
  ): { [key: string]: T } {
    // 定义 keyGenerator 函数，用于生成唯一键
    const keyGenerator = (item: T): string => {
      return keys.map((e) => `${item[e]}`).join("+");
    };

    // 使用 reduce 方法将数组元素存入对象
    return list.reduce((map: { [key: string]: T }, item: T) => {
      map[keyGenerator(item)] = item;
      return map;
    }, {});
  }

  static isESModuleByPackageJson() {
    const packageJsonPath = path.resolve(process.cwd(), "package.json");

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = require(packageJsonPath);
      if (Object.hasOwnProperty.call(packageJson, "type")) {
        return packageJson.type === "module";
      }
    }

    return "";
  }

  static getRowKey<T extends { name: string; port?: string | number }>(
    rowData: T
  ): string {
    return `${rowData.name}+${rowData.port}`;
  }
}

export default Utils;
