// src/utils/errors.ts
export class AppError extends Error {
  code: number; // 业务状态码
  status: number; // HTTP状态码

  constructor(message: string, code: number = 500, status: number = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}