"use strict";

let extractListFromYAML = require("./extract-json");
const util = require("util");
const exec_process = util.promisify(require("child_process").exec);
const chalk = require("chalk");

const DEFAULT_CLI_HOME = ".mes-cli";
const path = require("path");
const { homedir } = require("os");
const cacheDir = `${homedir()}/${DEFAULT_CLI_HOME}`;

const fs = require("fs");
const { log, inquirer, spinner, sleep } = require("@mes-cli/utils");

log.level = "info";
const COMPONENT_FILE = ".componentrc";
const TYPE_PROJECT = "project";
const TYPE_COMPONENT = "component";

const DEFAULT_TYPE = TYPE_PROJECT;

async function init(options = {}) {
  try {
    // 设置 targetPath
    let targetPath = process.cwd();

    if (!options.targetPath) {
      options.targetPath = targetPath;
    }

    log.verbose("init", options);
    // 完成项目初始化的准备和校验工作

    let initType = await getInitType();
    log.verbose("initType", initType);

    if (initType === TYPE_PROJECT) {
      await installProject();
    } else if (initType === TYPE_COMPONENT) {
      await installComponent();
    } else {
      log.info("创建项目终止");
      return;
    }
  } catch (e) {
    if (options.debug) {
      log.error("Error:", e.stack);
    } else {
      log.error("Error:", e.message);
    }
  } finally {
    process.exit(0);
  }
}

async function installProject() {
  let list = await getProjectList();
  let selectedProject = await selectProject(list);
  console.log("选择的项目：", selectedProject);

  let projectName = await getProjectName();

  if (checkFileExistsInDirectory(path.resolve(__dirname, projectName))) {
    const continueWhenDirNotEmpty = await inquirer({
      type: "confirm",
      message: "当前文件夹不为空，是否继续创建项目？",
      defaultValue: false,
    });

    if (!continueWhenDirNotEmpty) {
      log.info("创建项目终止");
      return;
    }
  }

  let spinnerStart = spinner(`正在安装项目模板...`);
  await sleep(1000);
  await downloadTemplateToLocal(selectedProject);
  await copyTemplateToTargetDir(selectedProject, projectName);

  spinnerStart.stop(true);
  log.success("项目初始化成功，您可以按以下提示运行项目：");
  console.log();
  console.log("\t" + chalk.green(`cd ${projectName}`));
  console.log("\t" + chalk.green("yarn"));
  console.log("\t" + chalk.green("yarn serve"));
  console.log();
}

async function copyTemplateToTargetDir(selectedProject, projectName) {
  const projectPath = path.resolve(cacheDir, selectedProject.name);
  const dest = path.resolve(__dirname, projectName);
  await copyFolder(projectPath, dest);
}

function checkFileExistsInDirectory(filePath) {
  return fs.existsSync(filePath);
}

async function getProjectName() {
  return inquirer({
    type: "string",
    message: "请输入项目名称",
    defaultValue: "",
  });
}

async function selectProject(projects) {
  const choices = projects.map((project) => ({
    name: project.name,
    value: project,
  }));

  const questions = {
    type: "list",
    name: "selectedProject",
    message: "请选择一个项目：",
    choices: choices,
  };

  let selectedProject = await inquirer(questions);
  return selectedProject;
}
async function downloadTemplateToLocal(project) {
  let name = project.name;
  let url = project.url;
  const projectCacheDir = path.resolve(cacheDir, name);
  console.log("projectCacheDir", projectCacheDir);
  await exec_process(`rm -rf ${projectCacheDir}`);

  try {
    console.log(`git clone ${url} ${projectCacheDir}`);
    await exec_process(`git clone ${url} ${projectCacheDir}`);

    if (!fs.existsSync(projectCacheDir)) {
      throw new Error("执行 git clone 命令时出错");
    }
    console.log("文件下载成功");
  } catch {
    console.error("执行 git clone 命令时出错:", error);
  }
}

async function getProjectList() {
  const filePath = "../template/project.yaml";
  const extractedList = extractListFromYAML(filePath);
  return extractedList;
}

async function getComponentList() {
  const filePath = "../template/component.yaml";
  const extractedList = extractListFromYAML(filePath);
  return extractedList;
}

function getInitType() {
  console.log("get init type");
  return inquirer({
    type: "list",
    choices: [
      {
        name: "项目",
        value: TYPE_PROJECT,
      },
      {
        name: "组件",
        value: TYPE_COMPONENT,
      },
    ],
    message: "请选择初始化类型",
    defaultValue: DEFAULT_TYPE,
  });
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

module.exports = init;
