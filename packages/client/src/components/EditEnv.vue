<script lang="ts" setup>
import { ref, reactive, nextTick } from 'vue'
import { ElForm, type FormItemRule, ElMessage } from 'element-plus'
import { apiPrefix, fetchData } from '@/utils'
import type { DevServerModel, EnvModel, ListResponse } from '@envm/schemas'

const emit = defineEmits<{
  (e: 'refreshList'): void
}>()

const visible = ref(false)
const isEditMode = ref(false)
const currentId = ref('')

// 显示对话框，支持新增和编辑模式
const showDialog = (envItem?: EnvModel) => {
  visible.value = true
  getDevServerList()

  // 如果有传入数据，则进入编辑模式
  if (envItem) {
    isEditMode.value = true
    currentId.value = envItem.id
    // 复制数据到表单
    Object.assign(formData, { ...envItem })
  } else {
    // 否则进入新增模式
    isEditMode.value = false
    currentId.value = ''
    // 重置表单为默认值
    Object.assign(formData, defautlFormData)
  }

  // 清除之前的验证状态
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 公开方法供外部调用
defineExpose({
  showDialog,
})

const formRef = ref<InstanceType<typeof ElForm>>()

const defautlFormData: Omit<EnvModel, 'id'> = {
  apiBaseUrl: 'http://127.0.0.1:3010',
  port: 4099,
  name: '',
  devServerId: '',
  homePage: '/TestCom',
  status: 'stopped',
  description: '',
}

// 使用初始值填充表单
const formData = reactive<Omit<EnvModel, 'id'>>({ ...defautlFormData })

const rules = reactive<Partial<Record<string, FormItemRule[]>>>({
  name: [{ min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }],
  devServerId: [{ required: true, message: '请选择开发服务器', trigger: 'blur' }],
  apiBaseUrl: [
    { required: true, message: '请输入API服务器地址', trigger: 'blur' },
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
})

// 关闭对话框时重置表单
const handleClose = (done: () => void) => {
  resetForm()
  done()
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, defautlFormData)
  isEditMode.value = false
  currentId.value = ''

  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

/**
 * 新增环境配置
 */
const addEnvConfig = (envItem: Omit<EnvModel, 'id'>) => {
  fetchData({
    url: `${apiPrefix}/env/add`,
    method: 'POST',
    params: envItem,
  }).then(() => {
    ElMessage.success('新增成功')
    handleClose(() => {
      visible.value = false
    })
    emit('refreshList')
  })
}

/**
 * 更新环境配置
 */
const updateEnvConfig = (id: string, envItem: Omit<EnvModel, 'id'>) => {
  fetchData({
    url: `${apiPrefix}/env/update`,
    params: { id, ...envItem },
  }).then(() => {
    ElMessage.success('更新成功')
    handleClose(() => {
      visible.value = false
    })
    emit('refreshList')
  })
}

/**
 * 提交表单，根据模式决定是新增还是更新
 */
const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      const submitData = { ...formData }

      if (isEditMode.value && currentId.value) {
        updateEnvConfig(currentId.value, submitData)
      } else {
        addEnvConfig(submitData)
      }
    }
  })
}

const devServerOptions = ref<DevServerModel[]>([])
// 获取开发服务器列表
const getDevServerList = () => {
  fetchData<ListResponse<DevServerModel>>(`${apiPrefix}/server/list`)
    .then((data) => {
      devServerOptions.value = data?.list ?? []
    })
    .catch(() => {
      ElMessage.error('获取服务器列表失败')
    })
}
</script>
<template>
  <el-dialog
    v-model="visible"
    :title="isEditMode ? '编辑 API Server' : '新增 API Server'"
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
      <el-form-item label="API Server 地址" prop="apiBaseUrl">
        <el-input v-model="formData.apiBaseUrl" placeholder="例如：http://127.0.0.1:3000" />
      </el-form-item>

      <el-form-item label="Dev Server 地址" prop="devServerId">
        <el-select v-model="formData.devServerId" placeholder="请选择">
          <el-option
            v-for="item in devServerOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="绑定本地端口" prop="port">
        <el-input-number
          v-model="formData.port"
          :min="3000"
          :max="65535"
          :precision="0"
          size="default"
        />
      </el-form-item>

      <el-form-item label="首页地址" prop="homePage">
        <el-input v-model="formData.homePage" />
      </el-form-item>

      <el-form-item label="环境名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入" />
      </el-form-item>

      <el-form-item label="环境描述" prop="description">
        <el-input
          type="textarea"
          placeholder="请输入"
          v-model="formData.description"
          :rows="3"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>
</template>
