#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function findNearestDirectoryWithPackageJson(
  startingDirectory = process.cwd()
) {
  // 定义一个辅助函数，用于检查当前目录是否包含 package.json 文件
  function hasPackageJson(directory) {
    return fs.existsSync(path.join(directory, "package.json"));
  }

  // 从当前目录开始，逐级向上查找包含 package.json 文件的目录
  let currentDirectory = path.resolve(startingDirectory);

  while (currentDirectory !== "/") {
    if (hasPackageJson(currentDirectory)) {
      return currentDirectory;
    }

    // 向上一级目录
    currentDirectory = path.dirname(currentDirectory);
  }

  // 如果一直到根目录都没找到 package.json 文件，则返回 null 表示没找到
  return null;
}

// 使用示例
const nearestDirectory = findNearestDirectoryWithPackageJson();

if (nearestDirectory) {
  console.log("找到最近的包含 package.json 文件的目录:", nearestDirectory);
} else {
  console.log("未找到包含 package.json 文件的目录。");
}

module.exports = {
  findNearestDirectoryWithPackageJson,
};
