const fs = require("fs");
const yaml = require("yaml");

function extractListFromYAML(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const parsedYaml = yaml.parse(fileContent);

    return parsedYaml;
  } catch (err) {
    console.error("Error reading or parsing the YAML file:", err);
    return null;
  }
}

module.exports = extractListFromYAML;
