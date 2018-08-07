const gene = require('../index');
const path = require('path');
gene({
  apiType: 'rest',
  entry: path.resolve(__dirname, './exam.json'),
  className: 'ExamSrv',
  outputPath: path.resolve(__dirname, '../dist'),
  outputFileName: 'ExamSrv',
  outputExtname: 'ts',
  overwrite: true,
});