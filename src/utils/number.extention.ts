Number.prototype.prefixInteger = function (this: number, length: number) {
    return (`${Array(length).join('0')}${this}`).slice(-length);
  };
  
  export {};