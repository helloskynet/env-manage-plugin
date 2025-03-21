import * as fs from "fs";
import { join } from "path";

import Utils from "./Utils.js";

/**
 * 初始化配置文件
 * @param {boolean} force - 是否强制覆盖
 */
export const initConfig = async (force = false) => {
  const isESModule = await Utils.isESModuleByPackageJson();

  const FILE_EXT = isESModule ? ".mjs" : ".js";

  const CONFIG_FILE_NAME = `envm.config${FILE_EXT}`;
  // 模板文件路径
  const TEMPLATE_PATH = join(
    __dirname,
    `..`,
    `templates`,
    `${CONFIG_FILE_NAME}`
  );
  // 目标文件路径
  const TARGET_PATH = join(process.cwd(), CONFIG_FILE_NAME);
  try {
    // 检查目标文件是否存在
    const isTargetExist = fs.existsSync(TARGET_PATH);

    if (isTargetExist && !force) {
      console.log(
        `${CONFIG_FILE_NAME} already exists. Use --force to overwrite.`
      );
      return;
    }

    // 拷贝模板文件到目标路径
    fs.copyFileSync(TEMPLATE_PATH, TARGET_PATH);
    console.log(
      `${CONFIG_FILE_NAME} ${isTargetExist ? "overwritten" : "created"} successfully!`
    );
  } catch (err) {
    console.error("Failed to initialize envm.config.js:", err);
  }
};
