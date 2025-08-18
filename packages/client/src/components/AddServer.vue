<template>
  <el-dialog
    v-model="visible"
    title="新增开发服务器"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="130px"
      size="default"
    >
      <el-form-item label="服务名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入开发服务名称" />
      </el-form-item>

      <el-form-item label="服务地址" prop="devServerUrl">
        <el-input
          v-model="formData.devServerUrl"
          placeholder="webpack/vite等启动地址，例如：http://127.0.0.1:3000"
        />
      </el-form-item>

      <el-form-item label="服务描述" prop="description">
        <el-input
          type="textarea"
          v-model="formData.description"
          :rows="3"
          placeholder="请输入开发服务描述信息"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick } from 'vue'
import { ElForm, type FormItemRule } from 'element-plus'
import { apiPrefix, fetchData } from '@/utils'
import type { DevServerModel } from '@envm/schemas'

// 定义事件发射类型
const emit = defineEmits<{
  (e: 'refreshList'): void // 提交成功后通知父组件刷新列表
}>()

// 控制弹窗显示状态
const visible = ref(false)


// 提供给外部调用的显示弹窗方法
const showDialog = () => {
  visible.value = true
  // 重置表单状态
  resetForm()
}
defineExpose({
  showDialog,
})

// 表单引用
const formRef = ref<InstanceType<typeof ElForm>>()

// 表单默认数据
const defaultFormData: Partial<DevServerModel> = {
  name: '',
  description: '',
  devServerUrl: 'http://127.0.0.1:5173',
}

// 表单数据响应式对象
const formData = reactive<Partial<DevServerModel>>({ ...defaultFormData })

// 表单验证规则
const rules = reactive<Partial<Record<string, FormItemRule[]>>>({
  name: [{ min: 2, max: 30, message: '名称长度需在2-30个字符之间', trigger: 'blur' }],
  devServerUrl: [
    { required: true, message: '请输入开发服务地址', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        // 严格匹配 http/https + IP + 端口(3000-65535)
        const regex =
          /^(http|https):\/\/(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):(3000|[3-9]\d{3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5])$/

        if (regex.test(value)) {
          callback() // 校验通过
        } else {
          callback(new Error('请输入正确的地址（格式：http/https://IP:端口，端口范围3000-65535）'))
        }
      },
      trigger: 'blur',
    },
  ],
  description: [{ max: 200, message: '描述最多200个字符', trigger: 'blur' }],
})

// 关闭弹窗处理
const handleClose = (done: () => void) => {
  resetForm()
  done()
}

// 重置表单
const resetForm = () => {
  // 重置表单数据
  Object.assign(formData, defaultFormData)
  // 清除验证状态
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 提交表单到后端
const createDevServer = (serverData: DevServerModel) => {
  fetchData({
    url: `${apiPrefix}/server/add`,
    method: 'POST',
    data: serverData, // 使用data而非params，符合POST请求规范
  }).then(() => {
    // 关闭弹窗
    handleClose(() => {
      visible.value = false
    })
    // 通知父组件刷新列表
    emit('refreshList')
  })
}

// 表单提交处理
const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      const submitData: DevServerModel = {
        ...formData,
        name: formData.name || formData.devServerUrl,
      } as DevServerModel

      createDevServer(submitData)
    }
  })
}
</script>
