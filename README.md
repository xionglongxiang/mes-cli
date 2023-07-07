# MES前端统一研发脚手架

## About

MES前端统一研发脚手架

## Getting Started

### 安装：

```bash
npm install -g @mes-cli/core
```

### 创建项目

项目/组件初始化

```bash
mes-cli init 
```

强制清空当前文件夹

```bash
mes-cli init --force
```

### 发布项目

发布项目/组件

```bash
mes-cli publish
```

强制更新所有缓存

```bash
mes-cli publish --force
```

正式发布

```bash
mes-cli publish --prod
```

手动指定build命令

```bash
mes-cli publish --buildCmd "npm run build:test"
```


## More

清空本地缓存：

```bash
mes-cli clean
```

DEBUG 模式：

```bash
mes-cli --debug
```

调试本地包：

```bash
mes-cli init --packagePath /Users/xlx/test/mes-cli/packages/init/
```
