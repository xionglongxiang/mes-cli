"use strict";

const util = require("util");
const exec_process = util.promisify(require("child_process").exec);
const chalk = require("chalk");

const DEFAULT_CLI_HOME = ".mes-cli";
const path = require("path");
const { homedir } = require("os");
const cacheDir = `${homedir()}/${DEFAULT_CLI_HOME}`;

const { log } = require("@mes-cli/utils");
const fs = require("fs");
const yaml = require("js-yaml");
const path = require("path");
const yamlFilePath = path.join(__dirname, ".mes-cli", "variables.yaml");

log.level = "info";

async function config(options = {}) {
  console.log("exec config command in config lib", options);
  try {
    log.verbose("config", options);
    // 完成项目初始化的准备和校验工作
  } catch (e) {
    if (options.debug) {
      console.log();
      log.error("Error:", e.stack);
    } else {
      console.log();
      log.error("Error:", e.message);
    }
  } finally {
    process.exit(0);
  }
}

module.exports = config;
