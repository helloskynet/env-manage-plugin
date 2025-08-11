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
      label-width="120px"
      size="default"
    >
      <el-form-item label="环境名称" prop="name">
        <el-input v-model="formData.name" />
      </el-form-item>

      <el-form-item label="环境描述" prop="description">
        <el-input
          type="textarea"
          v-model="formData.description"
          :rows="3"
        />
      </el-form-item>

      <el-form-item label="绑定端口" prop="port">
        <el-input-number
          v-model="formData.port"
          :min="3000"
          :max="65535"
          :precision="0"
          size="default"
        />
      </el-form-item>

      <el-form-item label="服务器ID" prop="devServerId">
        <el-select
          v-model="formData.devServerId"
          placeholder="Select"
          style="width: 240px"
        >
          <el-option
            v-for="item in devServerOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input v-model="formData.devServerId" />
      </el-form-item>

      <el-form-item label="IP地址" prop="ip">
        <el-input v-model="formData.ip" />
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
import { type DevServerInterface, type EnvItemInterface, type ListResponse } from '@envm/schemas'

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

const defautlFormData: EnvItemInterface = {
  ip: '',
  port: 0,
  name: '',
  devServerId: '',
  homePage: '',
  status: 'stopped',
}

// 使用初始值填充表单
const formData = reactive(defautlFormData)

// 修正正则表达式
const rules = reactive<Partial<Record<string, FormItemRule[]>>>({
  name: [
    { required: true, message: '请输入环境名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }],
  devServerId: [{ required: true, message: '请输入服务器ID', trigger: 'blur' }],
  ip: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    {
      pattern: /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/,
      message: '请输入有效的IP地址',
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
const addDevServer = (envItem: EnvItemInterface) => {
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

const devServerOptions = ref<{ label: string; value: string }[]>([])
// 获取开发服务器列表
const getDevServerList = () => {
  fetchData<ListResponse<DevServerInterface>>(`${props.apiPrefix}/server/list`).then((data) => {
    devServerOptions.value =
      data?.list.map((item: { name: string; id: string }) => ({
        label: item.name,
        value: item.id,
      })) ?? []
  })
}
getDevServerList()
</script>
