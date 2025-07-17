/**
 * Response code constants
 * @file src/constants/responseCode.ts
 * @description This file defines the response codes used throughout the application.
 * @module constants/responseCode
 */
export const ResponseCode = {
  /**
   * 成功
   */
  SUCCESS: 200,
  /**
   * 创建成功
   */
  CREATED: 201,
  /**
   * 请求已接受
   */
  BAD_REQUEST: 400,
  /**
   * 未授权访问
   */
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const; // 只读约束

