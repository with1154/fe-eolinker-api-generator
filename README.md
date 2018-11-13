eolinker接口api代码生成
查看test/test.js 


// 生成的xhr
```js
function createEntity({ name, stock, cost, categoryID, storehose }) {
  return xhr({
    method: 'post',
    headers:{"Content-Type":"multipart/form-data"},
    url: `/api/order/entity/create`,
    data: { name, stock, cost, categoryID, storehose },
    custom:arguments[1] // 自定义参数
  })
}
```
