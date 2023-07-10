const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");
const program = require("commander");
const colors = require("colors/safe");
const userHome = require("user-home");
const semver = require("semver");
const { log, npm, Package, exec, locale } = require("@mes-cli/utils");
const packageConfig = require("../package");
const add = require("@mes-cli/add");

const {
  LOWEST_NODE_VERSION,
  DEFAULT_CLI_HOME,
  NPM_NAME,
  DEPENDENCIES_PATH,
} = require("../libs/const");

module.exports = cli;

let args;
let config;

async function cli() {
  try {
    await prepare();
    registerCommand();
  } catch (e) {
    log.error(e.message);
  }
}

function registerCommand() {
  program.version(packageConfig.version).usage("<command> [options]");

  program
    .command("about")
    .description("关于mes-cli")
    .action(() => {
      log.success("欢迎使用", "MES统一研发脚手架");
      log.success("作者介绍", "Longxiang Xiong");
    });

  program.command("add").description("添加内容").action(add);

  program
    .command("create [type]")
    .description("项目初始化")
    .option("--packagePath <packagePath>", "手动指定 create 包路径")
    .option("--force", "覆盖当前路径文件（谨慎使用）")
    .action(async (type, { packagePath, force }) => {
      const packageName = "@mes-cli/create";
      await execCommand(
        { packagePath, packageName, packageVersion: packageConfig.version },
        { type, force }
      );
    });

  program
    .command("clean")
    .description("清空缓存文件 2")
    .option("-a, --all", "清空全部")
    .option("-d, --dep", "清空依赖文件")
    .action((options) => {
      log.notice("开始清空缓存文件");
      if (options.all) {
        cleanAll();
      } else if (options.dep) {
        const depPath = path.resolve(config.cliHome, DEPENDENCIES_PATH);
        if (fs.existsSync(depPath)) {
          fse.emptyDirSync(depPath);
          log.success("清空依赖文件成功", depPath);
        } else {
          log.success("文件夹不存在", depPath);
        }
      } else {
        cleanAll();
      }
    });

  program.option("--debug", "打开调试模式").parse(process.argv);

  if (args._.length < 1) {
    program.outputHelp();
    console.log();
  }
}

async function execCommand(
  { packagePath, packageName, packageVersion },
  extraOptions
) {
  let rootFile;
  try {
    if (packagePath) {
      const execPackage = new Package({
        targetPath: packagePath,
        storePath: packagePath,
        name: packageName,
        version: packageVersion,
      });
      rootFile = execPackage.getRootFilePath(true);
    } else {
      const { cliHome } = config;
      const packageDir = `${DEPENDENCIES_PATH}`;
      const targetPath = path.resolve(cliHome, packageDir);
      const storePath = path.resolve(targetPath, "node_modules");
      const package = new Package({
        targetPath,
        storePath,
        name: packageName,
        version: packageVersion,
      });

      if (await package.exists()) {
        console.log("package.exists");
        await package.update();
      } else {
        console.log("package.not exists");
        await package.install();
      }
      rootFile = package.getRootFilePath();
    }
    const _config = Object.assign({}, config, extraOptions, {
      debug: args.debug,
    });
    if (fs.existsSync(rootFile)) {
      const code = `require('${rootFile}')(${JSON.stringify(_config)})`;
      const p = exec("node", ["-e", code], { stdio: "inherit" });
      p.on("error", (e) => {
        log.verbose("命令执行失败:", e);
        handleError(e);
        process.exit(1);
      });
      p.on("exit", (c) => {
        log.verbose("命令执行成功:", c);
        process.exit(c);
      });
    } else {
      throw new Error("入口文件不存在，请重试！");
    }
  } catch (e) {
    log.error("exec command", e.message);
  }
}

function handleError(e) {
  if (args.debug) {
    log.error("Error:", e.stack);
  } else {
    log.error("Error:", e.message);
  }
  process.exit(1);
}

function cleanAll() {
  if (fs.existsSync(config.cliHome)) {
    fse.emptyDirSync(config.cliHome);
    log.success("清空全部缓存文件成功", config.cliHome);
  } else {
    log.success("文件夹不存在", config.cliHome);
  }
}

async function prepare() {
  checkPkgVersion(); // 检查当前运行版本
  checkNodeVersion(); // 检查 node 版本
  checkRoot(); // 检查是否为 root 启动
  checkUserHome(); // 检查用户主目录
  checkInputArgs(); // 检查用户输入参数
  checkEnv(); // 检查环境变量
  await checkGlobalUpdate(); // 检查工具是否需要更新
}

async function checkGlobalUpdate() {
  log.verbose("检查 mes-cli 最新版本");

  const currentVersion = packageConfig.version;
  const lastVersion = await npm.getNpmLatestSemverVersion(
    NPM_NAME,
    currentVersion
  );
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      colors.yellow(`请手动更新 ${NPM_NAME}，当前版本：${packageConfig.version}，最新版本：${lastVersion}
                更新命令： npm install -g ${NPM_NAME}`)
    );
  } else {
    log.success("当前 mes-cli 是最新版本！");
  }
}

function checkEnv() {
  log.verbose("开始检查环境变量");
  const dotenv = require("dotenv");
  dotenv.config({
    path: path.resolve(userHome, ".env"),
  });
  config = createCliConfig(); // 准备基础配置
  log.verbose("环境变量", config);
}

function createCliConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, DEFAULT_CLI_HOME);
  }
  return cliConfig;
}

function checkInputArgs() {
  const minimist = require("minimist");
  args = minimist(process.argv.slice(2)); // 解析查询参数
  checkArgs(args); // 校验参数
  log.verbose("输入参数", args);
}

function checkArgs(args) {
  if (args.debug) {
    process.env.LOG_LEVEL = "verbose";
  } else {
    process.env.LOG_LEVEL = "info";
  }
  log.level = process.env.LOG_LEVEL;
}

function checkUserHome() {
  if (!userHome || !fs.existsSync(userHome)) {
    throw new Error(colors.red("当前登录用户主目录不存在！"));
  }
}

function checkRoot() {
  const rootCheck = require("root-check");
  rootCheck(colors.red("请避免使用 root 账户启动本应用"));
}

function checkNodeVersion() {
  const semver = require("semver");
  if (!semver.gte(process.version, LOWEST_NODE_VERSION)) {
    throw new Error(
      colors.red(`mes-cli 需要安装 v${LOWEST_NODE_VERSION} 以上版本的 Node.js`)
    );
  }
}

function checkPkgVersion() {
  log.notice("cli", packageConfig.version);
  log.success(locale.welcome);
}
