const fs = require('fs').promises;
const path = require('path');

/**
 * 拷贝 package.json 并删除指定依赖
 * @param {string} sourcePath - 源 package.json 路径（默认当前目录）
 * @param {string} targetDir - 目标目录（如 "./dist/prod"）
 * @param {string} depToRemove - 要删除的依赖名（如 "lodash"）
 */
async function copyAndModifyPackageJson(
  sourcePath = './server/package.json',
  targetDir = './dist',
  depToRemove = '@envm/schemas' // 替换为你要删除的依赖
) {
  try {
    // 1. 读取源 package.json
    const sourceContent = await fs.readFile(sourcePath, 'utf8');
    const packageJson = JSON.parse(sourceContent);

    // 2. 删除指定依赖（区分 dependencies 和 devDependencies）
    if (packageJson.dependencies?.[depToRemove]) {
      delete packageJson.dependencies[depToRemove];
      console.log(`✅ 从 dependencies 中删除依赖：${depToRemove}`);
    }
    if (packageJson.devDependencies?.[depToRemove]) {
      delete packageJson.devDependencies[depToRemove];
      console.log(`✅ 从 devDependencies 中删除依赖：${depToRemove}`);
    }

    // 3. 确保目标目录存在（不存在则创建）
    await fs.mkdir(targetDir, { recursive: true });

    // 4. 写入目标目录（格式化 JSON，便于阅读）
    const targetPath = path.join(targetDir, 'package.json');
    await fs.writeFile(targetPath, JSON.stringify(packageJson, null, 2), 'utf8');
    console.log(`✅ package.json 已拷贝到：${targetPath}`);

  } catch (err) {
    console.error('❌ 操作失败：', err.message);
    process.exit(1); // 失败时退出脚本
  }
}

// 执行脚本（可根据需要修改参数）
copyAndModifyPackageJson(
  './packages/server/package.json', // 源文件路径
  './dist/',    // 目标目录
  '@envm/schemas'         // 要删除的依赖名
);