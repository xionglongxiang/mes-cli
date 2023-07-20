#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 要插入的新路由配置
const newRouteConfig = `
{
  path: '/new-route',
  name: 'newRoute',
  component: () => import('../views/NewRouteView.vue')
},
`;

// 生成router/index.ts的绝对路径
const routerFilePath = path.resolve(__dirname, 'router/index.ts');

// 读取现有的router/index.ts文件内容
fs.readFile(routerFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // 使用正则表达式匹配现有路由配置，找到匹配位置
  const regex = /(routes:\s*\[\s*{[^]*?\n\s*\}\s*,)/;
  const match = data.match(regex);
  if (!match) {
    console.error('Router configuration not found.');
    return;
  }

  // 获取现有代码块的缩进
  const indent = match[0].match(/\n\s+/)[0].replace(/\n/, '');
  console.log('match[0]', indent.length)

  // 在匹配到的代码块下面插入新的路由配置，并进行缩进处理
  const modifiedContent = data.replace(match[1], `${match[1]}\n${indent}${newRouteConfig.trim().replace(/\n/g, `\n${indent}`)}`);

  // 保存修改后的文件
  fs.writeFile(routerFilePath, modifiedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('New route added successfully.');
    }
  });
});
