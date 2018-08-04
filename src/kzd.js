const gene = require('../index');
const path = require('path');
gene({
  apiType: 'rest',
  entry: path.resolve(__dirname, './kzd.json'),
  className: 'QuestSrv',
  outputPath: path.resolve(__dirname, '../dist'),
  output: 'QuestSrv',
  overwrite: true,
  importHead: `import xhr from  './xhr/xhr'`,
});