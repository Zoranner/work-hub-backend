import 'src/utils/object.extension';

Array.prototype.stringifyIncludes = function <T>(this: T[], value: T) {
  let includes = false;
  this.some(element => {
    if (Object.stringifyEquals(value, element)) {
      includes = true;
      return true;
    }
  });
  return includes;
};

export {};
