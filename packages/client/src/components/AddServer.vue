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
      label-width="120px"
      size="default"
    >
      <el-form-item label="服务器名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入开发服务器名称" />
      </el-form-item>

      <el-form-item label="服务器描述" prop="description">
        <el-input
          type="textarea"
          v-model="formData.description"
          :rows="3"
          placeholder="请输入服务器描述信息"
        />
      </el-form-item>

      <el-form-item label="端口号" prop="port">
        <el-input-number
          v-model="formData.port"
          :min="1"
          :max="65535"
          :precision="0"
          size="default"
          placeholder="请输入端口号"
        />
      </el-form-item>

      <el-form-item label="IP地址" prop="ip">
        <el-input v-model="formData.ip" placeholder="例如：192.168.1.100" />
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
import { fetchData } from '@/utils'
import { type DevServerInterface } from '@envm/schemas'

// 定义事件发射类型
const emit = defineEmits<{
  (e: 'refreshList'): void // 提交成功后通知父组件刷新列表
}>()

// 控制弹窗显示状态
const visible = ref(false)

// 接收父组件传入的API前缀
const props = defineProps<{
  apiPrefix: string
}>()

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
const defaultFormData: Partial<DevServerInterface> = {
  name: '888',
  description: '',
  port: 1,
  ip: '2.3.4.5',
}

// 表单数据响应式对象
const formData = reactive<Partial<DevServerInterface>>({ ...defaultFormData })

// 表单验证规则
const rules = reactive<Partial<Record<string, FormItemRule[]>>>({
  name: [
    { required: true, message: '请输入服务器名称', trigger: 'blur' },
    { min: 2, max: 30, message: '名称长度需在2-30个字符之间', trigger: 'blur' },
  ],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }],
  ip: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    {
      pattern: /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/,
      message: '请输入有效的IP地址（例如：192.168.1.1）',
      trigger: 'blur',
    },
    {
      validator: (rule, value, callback) => {
        // 进一步验证IP地址每个段的有效性（0-255）
        const segments = (value as string).split('.')
        const isValid = segments.every((seg) => {
          const num = parseInt(seg, 10)
          return !isNaN(num) && num >= 0 && num <= 255
        })
        void (isValid ? callback() : callback(new Error('IP地址段需在0-255之间')))
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
const createDevServer = (serverData: DevServerInterface) => {
  fetchData({
    url: `${props.apiPrefix}/server/add`,
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
      // 生成唯一ID（实际项目可能由后端生成）
      const submitData: DevServerInterface = {
        ...formData,
      } as DevServerInterface

      createDevServer(submitData)
    }
  })
}
</script>
