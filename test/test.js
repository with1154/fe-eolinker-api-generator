const gene = require('../index');
const path = require('path');
gene({
  apiType: 'rest',
  entry: path.resolve(__dirname, './test.json'),
  className: 'QaSrv',
  importHead: `import xhr from  './xhr/xhr'`,
  outputPath: path.resolve(__dirname, '../dist'),
  outputFileName: 'aaa',
  outputExtname: 'ts',
  overwrite: true,
  globalPostJson: false,
});