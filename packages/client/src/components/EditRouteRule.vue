<script lang="ts" setup>
import { ref, reactive, nextTick } from 'vue'
import { ElForm, type FormItemRule, ElMessage } from 'element-plus'
import { apiPrefix, fetchData } from '@/utils'
import type { EnvModel, ListResponse } from '@envm/schemas'

interface RouteRuleModel {
  id?: string
  envId: string
  pathPrefix: string
  targetEnvId: string
  targetEnvName?: string
  description?: string
  injectScript?: boolean
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
const showDialog = (envId: string, ruleItem?: RouteRuleModel) => {
  visible.value = true
  currentEnvId.value = envId
  getEnvList()

  // 如果有传入数据，则进入编辑模式
  if (ruleItem && ruleItem.id) {
    isEditMode.value = true
    currentId.value = ruleItem.id
    // 复制数据到表单
    Object.assign(formData, { ...ruleItem })
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

const defaultFormData: Omit<RouteRuleModel, 'id'> = {
  envId: '',
  pathPrefix: '',
  targetEnvId: '',
  targetEnvName: '',
  description: '',
  injectScript: false,
}

// 使用初始值填充表单
const formData = reactive<Omit<RouteRuleModel, 'id'>>({ ...defaultFormData })

// 动态计算 targetEnvId 是否必填
const isTargetEnvRequired = () => !formData.injectScript

const rules = reactive<Partial<Record<string, FormItemRule[]>>>({
  pathPrefix: [
    { required: true, message: '请输入路径前缀', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        // 路径前缀必须以 / 开头
        if (value.startsWith('/')) {
          callback()
        } else {
          callback(new Error('路径前缀必须以 / 开头'))
        }
      },
      trigger: 'blur',
    },
  ],
  targetEnvId: [
    {
      validator: (rule, value, callback) => {
        if (isTargetEnvRequired() && !value) {
          callback(new Error('请选择目标环境'))
        } else {
          callback()
        }
      },
      trigger: 'change',
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
  Object.assign(formData, defaultFormData)
  isEditMode.value = false
  currentId.value = ''
  currentEnvId.value = ''

  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 获取环境列表
const envOptions = ref<EnvModel[]>([])
const getEnvList = () => {
  fetchData<ListResponse<EnvModel>>(`${apiPrefix}/env/getlist`)
    .then((data) => {
      // 过滤掉当前环境本身，确保不过滤空字符串
      const currentId = currentEnvId.value
      envOptions.value = (data?.list ?? []).filter(
        (env) => !currentId || env.id !== currentId
      )
    })
    .catch(() => {
      ElMessage.error('获取环境列表失败')
    })
}

// 选择目标环境时更新名称
const handleTargetEnvChange = (envId: string) => {
  const selectedEnv = envOptions.value.find((env) => env.id === envId)
  if (selectedEnv) {
    formData.targetEnvName = selectedEnv.name || selectedEnv.apiBaseUrl
  }
}

/**
 * 新增路由规则
 */
const addRouteRule = (ruleItem: Omit<RouteRuleModel, 'id'>) => {
  fetchData({
    url: `${apiPrefix}/route-rule/add`,
    method: 'POST',
    params: ruleItem,
  }).then(() => {
    ElMessage.success('新增成功')
    handleClose(() => {
      visible.value = false
    })
    emit('refreshList')
  })
}

/**
 * 更新路由规则
 */
const updateRouteRule = (id: string, ruleItem: Omit<RouteRuleModel, 'id'>) => {
  fetchData({
    url: `${apiPrefix}/route-rule/update`,
    params: { id, ...ruleItem },
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
        updateRouteRule(currentId.value, submitData)
      } else {
        addRouteRule(submitData)
      }
    }
  })
}
</script>
<template>
  <el-dialog
    v-model="visible"
    :title="isEditMode ? '编辑路由规则' : '新增路由规则'"
    width="500px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      size="default"
    >
      <el-form-item label="路径前缀" prop="pathPrefix">
        <el-input
          v-model="formData.pathPrefix"
          placeholder="例如：/api/user"
        />
      </el-form-item>

      <el-form-item label="注入Script">
        <el-switch v-model="formData.injectScript" />
        <div style="color: #999; font-size: 12px; margin-top: 4px">
          开启后将在响应HTML中注入脚本，且目标环境可为空
        </div>
      </el-form-item>

      <el-form-item
        label="目标环境"
        prop="targetEnvId"
        :required="!formData.injectScript"
      >
        <el-select
          v-model="formData.targetEnvId"
          placeholder="请选择目标环境"
          :clearable="formData.injectScript"
          @change="handleTargetEnvChange"
        >
          <el-option
            v-for="item in envOptions"
            :key="item.id"
            :label="item.name || item.apiBaseUrl"
            :value="item.id"
          />
        </el-select>
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