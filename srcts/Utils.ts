const fs = require("fs");
const path = require("path");

class Utils {
  /**
   * 去除具有相同 name 和 port 组合的环境配置重复项
   * @param {Array} envList - 环境配置列表
   * @returns {Array} - 去重后的环境配置列表
   */
  static removeEnvDuplicates = (envList) => {
    const uniqueMap = new Map();
    const result = [];

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
  static generateMap(list, keys = ["name", "port"]) {
    const keyGenerator = (item) => {
      return keys
        .map((e) => {
          return `${item[e]}`;
        })
        .join("+");
    };
    return list.reduce((map, item) => {
      map[keyGenerator(item)] = item;
      return map;
    }, {});
  }

  /**
   * 判断文件是否是 ES Module
   * @param {string} filePath - 文件路径
   * @returns {boolean}
   */
  static isESModule(filePath) {
    try {
      // 检查文件扩展名
      if (filePath.endsWith(".mjs")) return true;
      if (filePath.endsWith(".cjs")) return false;

      // 检查 package.json 的 type 字段

      const isESModule = Utils.isESModuleByPackageJson();

      if (isESModule !== "") {
        return isESModule;
      }

      // 检查文件内容
      const content = fs.readFileSync(filePath, "utf8");
      return content.includes("export default") || content.includes("export ");
    } catch (error) {
      console.error(`Failed to check module type at ${filePath}:`, error);
      return false;
    }
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
}

module.exports = Utils;
