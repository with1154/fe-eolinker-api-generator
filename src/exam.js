const gene = require('../index');
const path = require('path');
gene({
  type: 'rest',
  entry: path.resolve(__dirname, './exam.json'),
  className: 'ExamSrv',
  outputPath: path.resolve(__dirname, '../dist'),
  output: 'ExamSrv',
  overwrite: true,
});