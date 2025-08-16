<template>
  <el-dialog
    v-model="visible"
    title="环境配置"
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

      <el-form-item label="绑定本地端口" prop="port">
        <el-input-number
          v-model="formData.port"
          :min="3000"
          :max="65535"
          :precision="0"
          size="default"
        />
      </el-form-item>

      <el-form-item label="开发服务地址" prop="devServerId">
        <el-select v-model="formData.devServerId" placeholder="请选择开发服务地址">
          <el-option
            v-for="item in devServerOptions"
            :key="item.devServerUrl"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="API环境地址" prop="apiBaseUrl">
        <el-input v-model="formData.apiBaseUrl" placeholder="例如：http://127.0.0.1:3000" />
      </el-form-item>

      <el-form-item label="首页地址" prop="homePage">
        <el-input v-model="formData.homePage" />
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
import type { DevServerModel, EnvModel, ListResponse } from '@envm/schemas'

const emit = defineEmits<{
  (e: 'refreshList'): void
}>()

const visible = ref(false)

const props = defineProps<{
  apiPrefix: string
}>()

const showDialog = () => {
  visible.value = true
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
}

// 使用初始值填充表单
const formData = reactive(defautlFormData)

// 修正正则表达式
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

// 优化关闭逻辑
const handleClose = (done: () => void) => {
  resetForm()
  done()
}

// 改进的重置方法
const resetForm = () => {
  // 重置为初始值而非空表单
  Object.assign(formData, defautlFormData)

  // 清除验证状态
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

/**
 * 提交表单
 *
 * @param envItem
 */
const addDevServer = (envItem: Omit<EnvModel, 'id'>) => {
  fetchData({
    url: `${props.apiPrefix}/env/add`,
    method: 'POST',
    params: envItem,
  }).then((res) => {
    console.log(res)
    handleClose(() => {
      visible.value = false
    })
    emit('refreshList')
  })
}

const submitForm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      // 创建新对象避免引用问题
      const submitData = { ...formData }
      // emit('submit', submitData)
      addDevServer(submitData)
    }
  })
}

const devServerOptions = ref<DevServerModel[]>([])
// 获取开发服务器列表
const getDevServerList = () => {
  fetchData<ListResponse<DevServerModel>>(`${props.apiPrefix}/server/list`).then((data) => {
    devServerOptions.value = data?.list ?? []
  })
}
getDevServerList()
</script>
