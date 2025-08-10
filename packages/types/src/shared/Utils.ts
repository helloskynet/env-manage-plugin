/**
 * 工具类型：将 T 类型中除 K 之外的所有属性转为可选属性
 */
export type PartialExcept<T, K extends keyof T> = {
  [P in K]-?: T[P];
} & {
  [P in Exclude<keyof T, K>]?: T[P];
};
