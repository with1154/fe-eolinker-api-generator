const fs = require('fs');
const path = require('path');
const pathToRegexp = require('path-to-regexp');
const paramsType = {
  0: 'string',
  3: 'number',
  12: 'array[number]',
  13: 'object',
  14: 'number',
};

function geneParam(params) {
  if (!params.length) return null;
  return params.map(item => item.paramKey).join(', ');
}

function geneComment({ commentName, funcParams }) {
  let str = '';
  funcParams.forEach((item, i) => {
    str += `   * @param { ${paramsType[+item.paramType]} } ${item.paramKey} - ${item.paramName}${i !== funcParams.length - 1 ? '\n' : ''}`;
  });
  if (str) {
    str = `\n${str}`;
  }
  const tpl = `
   /**
   * ${commentName}${str}
   * @return {Promise<any>}
   */`;
  return tpl;
}

function baseGeneXhr({ type, url, funcParams, params, funcName, commentName }) {
  let tpl = '';
  let funcPa = geneParam(funcParams);
  let dataPa = geneParam(params);
  funcPa = funcPa ? `{ ${funcPa} }` : '';
  dataPa = dataPa ? `{ ${dataPa} }` : '';
  const comment = geneComment({ commentName, funcParams });
  if (type === 0) {
    tpl = `
  ${comment}
  static ${funcName}(${funcPa}) {
    return xhr({
      method: 'post',
      url: \`${url}\`,
      data: ${dataPa || '{}'},
    })
  }`;
  } else if (type === 1) {
    tpl = `
  ${comment}  
  static ${funcName}(${funcPa}) {
    return xhr({
      url: \`${url}\`,
      params: ${dataPa || '{}'},
    })
  }`;
  }
  return tpl;
}

function normalGeneXhr({ type, uri, params, apiName }) {
  const name = uri.substr(uri.lastIndexOf('/') + 1);
  return baseGeneXhr({
    type,
    url: uri,
    funcParams: params,
    params,
    commentName: apiName,
    funcName: name,
  });
}

function restGeneXhr({ type, uri, params, apiName }) {
  const nameArray = apiName.split('-');
  if (nameArray.length <= 1) {
    throw new Error(`${apiName} 没有函数名称，需要以 '-' 分割 `);
  }

  const commentName = nameArray[0];
  const funcName = nameArray[nameArray.length - 1];

  let pathParamKeys = [];
  pathToRegexp(uri, pathParamKeys);
  const toPath = pathToRegexp.compile(uri);
  const urlPathKeys = {};
  pathParamKeys.forEach(item => {
    urlPathKeys[item.name] = `$\{${item.name}\}`;
  });
  // 请求路径
  const url = toPath(urlPathKeys, { encode: (value, token) => value });
  const pathParamKeysList = pathParamKeys.map(item => item.name);
  const paramList = params.filter(item => {
    return !pathParamKeysList.includes(item.paramKey);
  });
  return baseGeneXhr({
    type,
    url,
    funcParams: params,
    params: paramList,
    commentName,
    funcName,
  });
}

/**
 *
 * @param type - api类型 rest,normal
 * @param entry - 文件路径
 * @param output - 生成的文件名
 * @param {Function} geneXhr - 生成函数
 * @param overwrite - 是否覆盖生成的文件
 */
function geneApi({ entry, geneXhr, output, outputPath, overwrite, className }) {
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
      const { baseInfo, requestInfo, restfulParam, urlParam } = item;
      const { apiName, apiURI, apiRequestType } = baseInfo;
      const str = geneXhr({
        apiName,
        type: apiRequestType,
        uri: apiURI,
        params: [...requestInfo, ...restfulParam, ...urlParam].filter(item => !item.paramKey.includes('>>')),
      });
      strs += str;
    });

    fs.writeFileSync(`${outputPath}/${outputFile}.js`, `
import xhr from './xhr/xhr';

export default class ${className}{
  ${strs}
}`);
  });
}

module.exports = function (config) {
  config.geneXhr = config.type === 'rest' ? restGeneXhr : normalGeneXhr;
  return geneApi(config);
};
