<script lang="ts" setup>
import { ref, reactive, nextTick } from 'vue'
import { ElForm, type FormItemRule, ElMessage } from 'element-plus'
import { apiPrefix, fetchData } from '@/utils'

interface PasswordModel {
  id?: string
  envId: string
  name: string
  username: string
  password: string
  description?: string
  isDefault?: boolean
  createdAt?: string
  updatedAt?: string
}

const emit = defineEmits<{
  (e: 'refreshList'): void
}>()

const visible = ref(false)
const isEditMode = ref(false)
const currentId = ref('')
const currentEnvId = ref('')

// 显示对话框，支持新增和编辑模式
const showDialog = (envId: string, passwordItem?: PasswordModel) => {
  visible.value = true
  currentEnvId.value = envId

  // 如果有传入数据，则进入编辑模式
  if (passwordItem && passwordItem.id) {
    isEditMode.value = true
    currentId.value = passwordItem.id
    // 复制数据到表单
    Object.assign(formData, { ...passwordItem })
  } else {
    // 否则进入新增模式
    isEditMode.value = false
    currentId.value = ''
    // 重置表单为默认值
    Object.assign(formData, defaultFormData)
    formData.envId = envId
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

const defaultFormData: Omit<PasswordModel, 'id'> = {
  envId: '',
  name: '',
  username: '',
  password: '',
  description: '',
  isDefault: false,
}

// 使用初始值填充表单
const formData = reactive<Omit<PasswordModel, 'id'>>({ ...defaultFormData })

const rules = reactive<Partial<Record<string, FormItemRule[]>>>({
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
})

// 关闭对话框时重置表单
const handleClose = (done: () => void) => {
  resetForm()
  done()
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, defaultFormData)
  isEditMode.value = false
  currentId.value = ''
  currentEnvId.value = ''

  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

/**
 * 新增密码
 */
const addPassword = (passwordItem: Omit<PasswordModel, 'id'>) => {
  fetchData({
    url: `${apiPrefix}/password/add`,
    method: 'POST',
    params: passwordItem,
  }).then(() => {
    ElMessage.success('新增成功')
    handleClose(() => {
      visible.value = false
    })
    emit('refreshList')
  })
}

/**
 * 更新密码
 */
const updatePassword = (id: string, passwordItem: Omit<PasswordModel, 'id'>) => {
  fetchData({
    url: `${apiPrefix}/password/update`,
    params: { id, ...passwordItem },
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
        updatePassword(currentId.value, submitData)
      } else {
        addPassword(submitData)
      }
    }
  })
}
</script>
<template>
  <el-dialog
    v-model="visible"
    :title="isEditMode ? '编辑密码' : '新增密码'"
    width="500px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
      size="default"
    >
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="例如：数据库密码、API密钥"
        />
      </el-form-item>

      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="formData.username"
          placeholder="请输入用户名"
        />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="formData.password"
          placeholder="请输入密码"
        />
      </el-form-item>

      <el-form-item label="设为默认" prop="isDefault">
        <el-switch v-model="formData.isDefault" />
        <span style="margin-left: 8px; color: #909399; font-size: 12px;">
          默认密码是唯一的，设为默认将清除其他默认密码
        </span>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          type="textarea"
          placeholder="请输入"
          v-model="formData.description"
          :rows="2"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>
</template>