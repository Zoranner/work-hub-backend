Math.clamp = function (value, min, max) {
  return Math.max(min, Math.min(value, max));
};

Math.fixed2 = function (value) {
  return Math.floor(value * 100) / 100;
};
export {};
