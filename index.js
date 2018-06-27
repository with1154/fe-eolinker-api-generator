const fs = require('fs');
const path = require('path');

const paramsType = {
  0: 'string',
  3: 'number',
  12: 'array[number]',
};

function geneParam(requestInfo) {
  if (!requestInfo.length) return null;
  return requestInfo.map(item => item.paramKey).join(', ');
}

function geneComment({ apiName, params }) {
  let str = '';
  params.forEach((item, i) => {
    str += `   * @param { ${paramsType[+item.paramType]} } ${item.paramKey} - ${item.paramName}${i !== params.length - 1 ? '\n' : ''}`;
  });
  if (str) {
    str = `\n${str}`;
  }
  const tpl = `
   /**
   * ${apiName}${str}
   * @return {Promise<any>}
   */`;
  return tpl;
}

function geneGetXhr({
                      type, uri, params, apiName,
                    }) {
  let tpl = '';
  const name = uri.substr(uri.lastIndexOf('/') + 1);
  let pa = geneParam(params);
  pa = pa ? `{ ${pa} }` : '';
  const comment = geneComment({ apiName, params });
  if (type === 0) {
    tpl = `
  ${comment}
  static ${name}(${pa}) {
    return xhr({
      method: 'post',
      url: '${uri}',
      data: ${pa || '{}'},
    })
  }`;
  } else if (type === 1) {
    tpl = `
  ${comment}  
  static ${name}(${pa}) {
    return xhr({
      url: '${uri}',
      params: ${pa || '{}'},
    })
  }`;
  }
  return tpl;
}

/**
 *
 * @param entry - 文件路径
 * @param output - 生成的文件名
 * @param overwrite - 是否覆盖生成的文件
 */
function geneApi({ entry, output, outputPath, overwrite, className }) {
  const name = entry;
  const outputFile = output || path.parse(name).name;
  const exist = fs.existsSync(`./${outputFile}.js`);
  if (!overwrite) {
    if (exist) throw new Error(`${outputFile}.js 已存在`);
  }
  fs.readFile(entry, (err, data) => {
    if (err) throw err;
    const apiList = JSON.parse(data.toString());
    let strs = '';
    apiList.forEach((item) => {
      const { baseInfo, requestInfo } = item;
      const { apiName, apiURI, apiRequestType } = baseInfo;
      const str = geneGetXhr({
        apiName,
        type: apiRequestType,
        uri: apiURI,
        params: requestInfo,
      });
      strs += str;
    });

    fs.writeFileSync(`${outputPath}/${outputFile}.js`, `
import xhr from 'lt-xhr';

export default class ${className}{
  ${strs}
}`);
  });
}

module.exports = geneApi;
