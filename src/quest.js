const gene = require('../index');
const path = require('path');
gene({
  type: 'rest',
  entry: path.resolve(__dirname, './quest.json'),
  className: 'QuestionSrv',
  outputPath: path.resolve(__dirname, '../dist'),
  output: 'QuestionSrv',
  overwrite: true,
});