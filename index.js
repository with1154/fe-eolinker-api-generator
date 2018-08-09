const fs = require('fs');
const path = require('path');
const pathToRegexp = require('path-to-regexp');
const apiRequestType = {
  POST: 0,
  GET: 1,
  PUT: 2,
  DELETE: 3,
  HEAD: 4,
  OPTIONS: 5,
  PATCH: 6,
};
const paramsType = {
  0: 'string',
  1: 'file',
  2: 'json',
  3: 'int',
  4: 'float',
  5: 'double',
  6: 'date',
  7: 'datetime',
  8: 'boolean',
  9: 'byte',
  10: 'short',
  11: 'long',
  12: 'array',
  13: 'object',
  14: 'number',
};

const apiStatus = {
  0: '启动',
  1: '维护',
  2: '弃用',
  3: '待定',
  4: '开发',
  5: '测试',
  6: '对接',
  7: 'BUG',
};

const API_TYPE = {
  noraml: 'noraml',
  rest: 'rest',
};

const defaultConfig = {
  apiType: 'rest',
  overwrite: true,
  importHead: `import xhr from '../xhr/microXhr';`,
  outputExtname: `js`,
};

function apiFilter(api) {
  return [0, 6].includes(api.baseInfo.apiStatus);
}

function isPostJson(headerInfo) {
  return headerInfo.some(head => {
    return head.headerName === 'Content-Type' && head.headerValue === 'application/json';
  });
}

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

function baseGeneXhr({ type, url, funcParams, params, funcName, commentName, isPostJson }) {
  let tpl = '';
  let funcPa = geneParam(funcParams);
  let dataPa = geneParam(params);
  funcPa = funcPa ? `{ ${funcPa} }` : '';
  dataPa = dataPa ? `{ ${dataPa} }` : '';
  const comment = geneComment({ commentName, funcParams });
  if (type === apiRequestType.POST) {
    tpl = `
  ${comment}
  static ${funcName}(${funcPa}) {
    return xhr({
      method: 'post',
      url: \`${url}\`,${isPostJson ? '' : '\n      json: false,'}
      data: ${dataPa || '{}'},
    })
  }`;
  } else if (type === apiRequestType.GET) {
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

function normalGeneXhr({ type, uri, params, apiName, isPostJson }) {
  const name = uri.substr(uri.lastIndexOf('/') + 1);
  return baseGeneXhr({
    type,
    url: uri,
    funcParams: params,
    params,
    commentName: apiName,
    funcName: name,
    isPostJson,
  });
}

function restGeneXhr({ type, uri, params, apiName, isPostJson }) {
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
    isPostJson,
  });
}

/**
 * @param entry - 文件路径
 * @param output - 生成的文件名
 * @param {Function} geneXhr - 生成函数
 * @param overwrite - 是否覆盖生成的文件
 */
function geneApi(
  {
    entry,
    geneXhr,
    outputFileName,
    outputPath,
    overwrite = defaultConfig.overwrite,
    className,
    importHead = defaultConfig.importHead,
    outputExtname = defaultConfig.outputExtname,
  }) {
  const outputFile = outputFileName || path.parse(entry).name;
  const exist = fs.existsSync(`./${outputFile}.js`);
  if (!overwrite) {
    if (exist) throw new Error(`${outputFile}.js 已存在`);
  }
  fs.readFile(entry, (err, data) => {
    if (err) throw err;
    const apiList = JSON.parse(data.toString());
    let strs = '';
    apiList.filter(apiFilter).forEach((item) => {
      const { baseInfo, headerInfo, requestInfo, restfulParam, urlParam } = item;
      const { apiName, apiURI, apiRequestType } = baseInfo;
      const str = geneXhr({
        apiName,
        type: apiRequestType,
        uri: apiURI,
        isPostJson: isPostJson(headerInfo),
        params: [...requestInfo, ...restfulParam, ...urlParam].filter(item => !item.paramKey.includes('>>')),
      });
      strs += str;
    });

    fs.writeFileSync(`${outputPath}/${outputFile}.${outputExtname}`, `
${importHead}

export default class ${className}{
  ${strs}
}`);
  });
}

module.exports = function (config) {
  Object.assign(defaultConfig, config);
  config.geneXhr = config.apiType === API_TYPE.rest ? restGeneXhr : normalGeneXhr;
  return geneApi(config);
};
