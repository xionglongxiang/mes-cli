#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

async function formatEjsInDirectory(folderPath, options) {

  // 读取文件夹中的所有文件
  let files = await fs.readdirSync(folderPath);

  // 循环处理每个文件
  for (let i = 0; i < files.length; i++) {
    let file = files[i]
    const filePath = path.join(folderPath, file);

    // 使用fs.stat获取文件/文件夹信息
    let stats = await fs.statSync(filePath);
    if (stats.isDirectory()) {
      // 如果是文件夹，则递归调用formatEjsInDirectory处理子目录
      await formatEjsInDirectory(filePath, options);
    } else {
      // 如果是文件，则调用formatEjsFile处理ejs文件
      await formatEjsFile(filePath, options);
    }
  }
}

async function formatEjsFile(filePath, options) {
  // 检查文件是否为ejs文件
  if (path.extname(filePath) === '.ejs') {
    // 读取ejs文件内容
    let data = await  fs.readFileSync(filePath, 'utf8');
    // 使用ejs渲染文件内容
    console.log(data, options)
    const renderedContent = await ejs.render(data, options);

    // 将渲染后的内容写回到文件中
    await fs.writeFileSync(filePath, renderedContent, 'utf8');

    // ejs文件重命名
    await fs.renameSync(filePath, filePath.replace('.ejs', ''), () => {});
  }
}

async function convertEjsTemplate() {
  try {
    let PageName = 'Home'
    let templatePageName = 'page-name'
    // 使用当前目录下的dddd文件夹作为目标路径
    const options =  { PageName  }
    const targetFolderPath = path.join(__dirname, templatePageName);

    if (!fs.existsSync(targetFolderPath)) {
      throw new Error(`目标文件夹不存在: ${targetFolderPath}`, );
    }
    await formatEjsInDirectory(targetFolderPath, options);
    await fs.renameSync(targetFolderPath, path.resolve(__dirname, PageName))
  } catch (e) {
    console.log(e.message)
  }
}

convertEjsTemplate()