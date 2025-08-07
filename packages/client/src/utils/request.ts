import { ElMessage } from 'element-plus'
import type { BaseResponse } from 'envm'

// 定义参数类型：字符串（仅URL）或完整参数对象
type FetchDataInput =
  | string
  | {
      urlStr: string
      method?: string
      params?: Record<string, unknown>
    }

const fetchData = <R = unknown>(input: FetchDataInput) => {
  // 统一处理参数格式
  const options =
    typeof input === 'string'
      ? { urlStr: input, method: 'GET' } // 字符串时作为URL，默认GET
      : { method: 'GET', ...input } // 对象时合并默认方法

  return fetch(options.urlStr, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json', // 必须设置
    },
    // GET请求不发送body
    body: options.method !== 'GET' ? JSON.stringify(options.params) : undefined,
  })
    .then((res) => {
      return res.json() as Promise<BaseResponse<R>>
    })
    .then((res) => {
      console.log(res)
      if (res.code !== 200) {
        throw new Error(res.message || '请求失败')
      }
      return res.data
    })
    .catch((error) => {
      console.error('Error fetching data:', error)
      ElMessage.error('请求数据失败，请稍后重试')
      return undefined
    })
}

export { fetchData }
