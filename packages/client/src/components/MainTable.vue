<template>
  <el-button
    type="success"
    @click="handleAddEnv"
    :loading="refreshLoading"
  >新增API服务器</el-button>
  <el-button
    type="success"
    @click="handleAddServer"
    :loading="refreshLoading"
  >新增DevServer</el-button>
  <el-button
    type="success"
    @click="refreshList"
    :loading="refreshLoading"
  >刷新</el-button>
  <el-button
    type="success"
    @click="changeTable"
    :loading="refreshLoading"
  >切换</el-button>
  <el-button
    type="warning"
    @click="clearProxyCookies"
    :loading="refreshLoading"
  >清除所有代理 Cookie</el-button>
  <EnvTable v-if="isEnvTable" />
  <DevServerTable v-else/>

  <AddEnv ref="addEnvRef" @refreshList="refreshList" />
  <AddServer ref="addServerRef" @refreshList="refreshList" />
</template>

<script lang="ts" setup>
import AddEnv from './AddEnv.vue'
import AddServer from './AddServer.vue'
import EnvTable from './EnvTable.vue'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import type { DevServerModel, EnvModel, ListResponse } from '@envm/schemas'
import { apiPrefix, fetchData } from '@/utils'
import DevServerTable from './DevServerTable.vue'

const tableData = ref<EnvModel[]>([])

const devServerList = ref<DevServerModel[]>([])

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

/**
 * 获取环境列表
 *
 */
const getEnvList = () => {
  refreshLoading.value = true
  fetchData<ListResponse<EnvModel>>(`${apiPrefix}/env/getlist`)
    .then((res) => {
      tableData.value =
        res?.list.map((item) => {
          return {
            ...item,
            index: `${location.protocol}//${location.hostname}:${item.port}${item.homePage}`,
          }
        }) ?? []
    })
    .finally(() => {
      refreshLoading.value = false
    })
}
/**
 * 获取开发服务器列表
 *
 */
const getDevServerList = () => {
  fetchData<ListResponse<DevServerModel>>(`${apiPrefix}/server/list`).then((res) => {
    devServerList.value = res?.list || []
  })
}

onMounted(() => {
  getEnvList()
  getDevServerList()
  startWs()
})

/**
 * 当前是否为环境列表
 */
const isEnvTable = ref(true)

/**
 * 切换查看的数据类型
 */
const changeTable = () => {
  isEnvTable.value = !isEnvTable.value
}

const refreshList = () => {
  getEnvList()
  getDevServerList()
}

const clearProxyCookies = () => {
  fetch(`${apiPrefix}/clear-proxy-cookie`, {
    method: 'GET',
  })
    .then((res) => {
      return res.json()
    })
    .then((res) => {
      console.log(res)
      if (res.error) {
        ElMessage.error(res.error)
      } else if (res.message) {
        ElMessage.success(res.message)
      }
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
