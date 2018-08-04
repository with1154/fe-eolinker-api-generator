const gene = require('../index');
const path = require('path');
gene({
  apiType: 'rest',
  entry: path.resolve(__dirname, './test.json'),
  className: 'QaSrv',
  outputPath: path.resolve(__dirname, '../dist'),
  output: 'aaa',
  overwrite: true,
});