<script lang="ts" setup>
import EditEnv from './EditEnv.vue'
import EditServer from './EditServer.vue'
import EnvTable from './EnvTable.vue'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { apiPrefix, fetchData } from '@/utils'
import DevServerTable from './DevServerTable.vue'

const refreshLoading = ref(false)

const addEnvRef = ref()
const addServerRef = ref()

const handleAddEnv = () => {
  // 使用 $refs 调用子组件方法
  if (addEnvRef.value) {
    addEnvRef.value.showDialog()
  }
}
const handleAddServer = () => {
  // 使用 $refs 调用子组件方法
  if (addServerRef.value) {
    addServerRef.value.showDialog()
  }
}

onMounted(() => {
  startWs()
})

const envTableRef = ref()
const devServerTableRef = ref()
/**
 * 刷新表格
 */
const refreshList = () => {
  refreshLoading.value = true
  Promise.all([envTableRef.value?.refresh(), devServerTableRef.value?.refresh()]).finally(() => {
    refreshLoading.value = false
  })
}

/**
 * 清楚代理cookie
 */
const clearProxyCookies = () => {
  fetchData(`${apiPrefix}/clear-proxy-cookie`).then(() => {
    ElMessage.success('操作成功')
  })
}
const reconnect = () => {
  setTimeout(() => {
    console.log(`尝试重新连接ing...`)
    startWs()
  }, 2000)
}
const startWs = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host

  // 构建 WebSocket 连接的 URL
  const socketUrl = `${protocol}//${host}/${apiPrefix}`

  const socket = new WebSocket(socketUrl)

  // 连接建立时触发
  socket.addEventListener('open', () => {
    console.log('WebSocket 连接已建立')
    refreshList()

    // 当 WebSocket 连接关闭时，清除定时器
    socket.addEventListener('close', () => {
      console.log('WebSocket 连接已关闭')
      reconnect()
    })
  })

  // 接收到消息时触发
  socket.addEventListener('message', (event) => {
    console.log('收到消息:', event.data)
    const data = JSON.parse(event.data)
    if (data.action === 'filechange') {
      refreshList()
    }
  })

  // 连接出错时触发
  socket.addEventListener('error', () => {
    // console.error('WebSocket 连接出错:', event)
    reconnect()
  })
}
</script>
<template>
  <el-button
    type="success"
    @click="handleAddEnv"
    :loading="refreshLoading"
  >新增API Server</el-button>
  <el-button
    type="success"
    @click="handleAddServer"
    :loading="refreshLoading"
  >新增Dev Server</el-button>
  <el-button
    type="success"
    @click="refreshList"
    :loading="refreshLoading"
  >刷新</el-button>
  <el-button
    type="warning"
    @click="clearProxyCookies"
    :loading="refreshLoading"
  >清除所有代理 Cookie</el-button>
  <br />
  <br />
  <el-tabs type="card">
    <el-tab-pane label="API Server">
      <EnvTable ref="envTableRef" />
    </el-tab-pane>
    <el-tab-pane label="Dev Server">
      <DevServerTable ref="devServerTableRef" />
    </el-tab-pane>
  </el-tabs>

  <EditEnv ref="addEnvRef" @refreshList="refreshList" />
  <EditServer ref="addServerRef" @refreshList="refreshList" />
</template>
