"use strict";
const fse = require("fs-extra");
const fs = require("fs");
const path = require("path");
const pathExists = require("path-exists").sync;
let extractTypeFromYAML = require("./extract-json");
const ejs = require("ejs");

const util = require("util");
const exec_process = util.promisify(require("child_process").exec);
const { findNearestDirectoryWithPackageJson } = require("./getRootDir");

const { homedir } = require("os");
const { DEFAULT_CLI_HOME, SHOW_FILE_TYPE } = require("./const");
const { inquirer, log, npm, spinner, sleep } = require("@mes-cli/utils");

let workDir = findNearestDirectoryWithPackageJson();

const templateTypeFilePath = path.resolve(__dirname, "./template_type.yaml");
const TEMPLATE_TYPES = extractTypeFromYAML(templateTypeFilePath);

const DEFAULT_TYPE = Object.keys(TEMPLATE_TYPES)[0];

const cacheDir = `${homedir()}/${DEFAULT_CLI_HOME}`;

async function add() {
  log.level = process.env.LOG_LEVEL; // 进入add后log.level的层级还是info

  log.verbose("cacheDir", cacheDir);
  // 1. 选择添加的类型
  let templateType = await inquireTemplateType();
  log.verbose("templateType", templateType);
  let inputProjectName;

  if (templateType === "MES_SUB_APP_PAGE") {
    // 选择添加模版
    let selectedTemplate = await inquireTemplate(templateType);

    log.verbose("已选模板：", selectedTemplate);

    inputProjectName = await inquireAddName();

    log.verbose("添加页面：", inputProjectName);
    fse.ensureDirSync(cacheDir);

    let spinnerStart = spinner(`正在下载项目模板...`);
    await sleep(500);
    await downloadTemplateToLocal(selectedTemplate);
    spinnerStart.stop(true);
    spinnerStart = spinner(`正在复制项目模板到当前项目...`);
    await copyTemplateToTargetDir(selectedTemplate, inputProjectName);
    spinnerStart.stop(true);

    let PageTitle = await inquireTitle();
    spinnerStart = spinner(`正在填充模板字段...`);
    await formatTemplate({ PageTitle, PageName: inputProjectName });
    spinnerStart.stop(true);

    spinnerStart = spinner(`正在添加路由...`);
    await addRouter(inputProjectName);
    spinnerStart.stop(true);

    log.success("页面添加成功！");
    log.success("route 添加成功！您可以检查 router 文件是否添加正确！");
  } else {
  }
}

// 首字母大写
function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function addRouter(projectName) {
  let kebab = camelToKebab(projectName);

  const newRouteConfig = `
  {
    path: '/${kebab}',
    name: '${projectName}',
    component: () => import('../src/views/${kebab}/index.vue')
    },
  `;

  // 生成router/index.ts的绝对路径
  const routerFilePath = path.resolve(workDir, "src/router/index.ts");

  // 读取现有的router/index.ts文件内容
  fs.readFile(routerFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    // 使用正则表达式匹配现有路由配置，找到匹配位置
    const regex = /(routes:\s*\[\s*{[^]*?\n\s*\}\s*(,*))/g;
    const match = data.match(regex);

    if (!match) {
      console.error("Router configuration not found.");
      return;
    }

    let hasComma = match[0].substr(-1) === ",";
    // 获取现有代码块的缩进
    const indent = match[0].match(/\n\s+/)[0].replace(/\n/, "");

    // 在匹配到的代码块下面插入新的路由配置，并进行缩进处理
    const modifiedContent = data.replace(
      match[0],
      `${match[0]}${hasComma ? "" : ","}\n${indent}${newRouteConfig
        .trim()
        .replace(/\n/g, `\n${indent}`)}`
    );

    // 保存修改后的文件
    fs.writeFile(routerFilePath, modifiedContent, "utf8", (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        console.log("New route added successfully.");
      }
    });
  });
}

async function formatEjsInDirectory(folderPath, options) {
  // 读取文件夹中的所有文件
  let files = await fs.readdirSync(folderPath);

  // 循环处理每个文件
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
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
  if (path.extname(filePath) === ".ejs") {
    // 读取ejs文件内容
    let data = await fs.readFileSync(filePath, "utf8");
    // 使用ejs渲染文件内容
    const renderedContent = await ejs.render(data, options);

    // 将渲染后的内容写回到文件中
    await fs.writeFileSync(filePath, renderedContent, "utf8");

    // ejs文件重命名
    await fs.renameSync(filePath, filePath.replace(".ejs", ""), () => {});
  }
}

async function formatTemplate(options) {
  try {
    const { PageName } = options;

    const date = new Date();

    options = {
      ...options,
      Year: date.getFullYear(),
      Month: date.getMonth() + 1,
      Date: date.getDate(),
    };

    const targetFolderPath = path.join(
      workDir,
      `src/views/${camelToKebab(PageName)}`
    );

    if (!fs.existsSync(targetFolderPath)) {
      throw new Error(`目标文件夹不存在: ${targetFolderPath}`);
    }

    console.log("options", options);
    console.log("targetFolderPath", targetFolderPath);
    console.log("options", options);
    await formatEjsInDirectory(targetFolderPath, options);
    await fs.renameSync(
      targetFolderPath,
      path.resolve(workDir, `src/views/${camelToKebab(PageName)}`)
    );
  } catch (e) {
    console.log(e.message);
  }
}

// 选择添加的类型
function inquireTemplateType() {
  const choices = Object.keys(TEMPLATE_TYPES).map((type) => ({
    name: TEMPLATE_TYPES[type].name,
    value: type,
  }));

  return inquirer({
    type: "list",
    choices,
    message: "请选择初始化类型",
    defaultValue: DEFAULT_TYPE,
  });
}
// 输入文件名
async function inquireAddName() {
  const fileName = await inquirer({
    type: "input",
    name: "fileName",
    message: "请输入文件名称",
    default: "",
  });

  if (pathExists(`${workDir}/${fileName}`)) {
    console.log(`当前目录下已经存在 ${fileName} 文件`);
    return inquireAddName(); // 递归调用，直到输入的文件名在工作目录中不存在为止
  }

  return fileName;
}

async function inquireTitle(inputProjectName) {
  const PageTitle = await inquirer({
    type: "input",
    name: "PageTitle",
    message: "请输入页面的功能，作为文件头的Title：",
    default: inputProjectName,
  });

  return PageTitle;
}

// 选择项目模版
async function inquireTemplate(templateType) {
  const projects = TEMPLATE_TYPES[templateType];
  const choices = Object.keys(projects)
    .filter((key) => key !== "name")
    .map((key) => ({
      name: projects[key].name,
      value: projects[key],
      key: key,
    }));

  let selectedProject = await inquirer({
    choices,
    message: "请选择模版",
  });

  const selectedKey = choices.filter(
    (item) => item.name == selectedProject.name
  )[0].key;
  selectedProject.key = selectedKey;

  return selectedProject;
}

async function downloadTemplateToLocal(project) {
  let url = project.url;

  const projectCacheDir = path.resolve(cacheDir, project.key);
  await exec_process(`rm -rf ${projectCacheDir}`);

  try {
    await exec_process(`git clone ${url} ${projectCacheDir}`);

    if (!fs.existsSync(projectCacheDir)) {
      throw new Error("执行 git clone 命令时出错");
    }
    log.success("模板已经下载到本地！");
  } catch {
    console.error("执行 git clone 命令时出错:", error);
  }
}

async function copyTemplateToTargetDir(selectedTemplate, inputProjectName) {
  const projectPath = path.resolve(
    cacheDir,
    selectedTemplate.key.replace(/\s+/g, "_")
  );
  await copyFolder(projectPath, path.resolve(workDir, "src/views"));
  await fs.renameSync(
    path.resolve(workDir, "src/views/page-name"),
    path.resolve(workDir, `src/views/${camelToKebab(inputProjectName)}`)
  );
}

async function copyFolder(sourceDir, targetDir) {
  // 确保目标文件夹存在，如果不存在则创建
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }

  // 获取源文件夹中的所有文件和子文件夹
  const files = await fs.promises.readdir(sourceDir);

  // 遍历所有文件和子文件夹
  for (const file of files) {
    // 跳过 .git 文件夹
    if (file === ".git") {
      continue;
    }

    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    // 如果是子文件夹，则递归复制
    if ((await fs.promises.stat(sourcePath)).isDirectory()) {
      await copyFolder(sourcePath, targetPath);
    } else {
      // 如果是文件，则直接复制
      await fs.promises.copyFile(sourcePath, targetPath);
    }
  }
}

module.exports = add;
