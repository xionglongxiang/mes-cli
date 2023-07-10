const fs = require('fs');
const yaml = require('yaml');

function extractListFromYAML(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsedYaml = yaml.parse(fileContent);

    const list = [];
    for (const key in parsedYaml) {
      const item = {
        name: key,
        url: parsedYaml[key]
      };
      list.push(item);
    }

    return list;
  } catch (err) {
    console.error('Error reading or parsing the YAML file:', err);
    return null;
  }
}


module.exports = extractListFromYAML