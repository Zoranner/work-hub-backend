JSON.stringifyFixedCircle = function (value) {
  // 声明cache变量，便于匹配是否有循环引用的情况
  let cache = [];
  let stringify = JSON.stringify(value, function (_key, value) {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // 移除
        return;
      }
      // 收集所有的值
      cache.push(value);
    }
    return value;
  });
  cache = null; // 清空变量，便于垃圾回收机制回收
  return stringify;
};
export {};
