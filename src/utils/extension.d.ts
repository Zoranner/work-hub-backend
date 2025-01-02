declare global {
  interface JSON {
    stringifyFixedCircle(value: any): string;
  }

  interface Math {
    clamp(value: number, min: number, max: number): number;
    fixed2(value: number): number;
  }

  interface Object {
    stringifyEquals(value: any, target: any): boolean;
  }

  interface Array<T> {
    stringifyIncludes(this: T[], value: T): boolean;
  }

  interface Number {
    prefixInteger(this: number, length: number): string;
  }
}
export {};
