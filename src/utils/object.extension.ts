Object.stringifyEquals = function (value, target) {
  return JSON.stringifyFixedCircle(value) === JSON.stringifyFixedCircle(target);
};

export {};
