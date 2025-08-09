<template>
  <el-button
    type="success"
    @click="handleAddEnv"
    :loading="refreshLoading"
  >新增代理</el-button>
  <el-button
    type="success"
    @click="handleAddEnv"
    :loading="refreshLoading"
  >新增DevServer</el-button>
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
  <el-table
    :data="tableData"
    style="width: 100%"
    stripe
  >
    <el-table-column
      prop="name"
      label="环境名称"
      width="100"
    />
    <el-table-column
      prop="ip"
      label="环境代理详情"
      width="180"
    />
    <el-table-column
      prop="index"
      label="首页地址"
      show-overflow-tooltip
    >
      <template #default="scope">
        <el-link
          :disabled="scope.row.status === 'stop'"
          type="primary"
          :href="scope.row.index"
          target="_blank"
        >{{ scope.row.index }}</el-link>
      </template>
    </el-table-column>
    <el-table-column prop="port" label="端口" />
    <el-table-column prop="status" label="状态">
      <template #default="scope">
        <el-tag v-if="scope.row.status === 'stop'" type="danger">未启动</el-tag>
        <el-tag v-else type="success">已启动</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="devServerName" label="devServer">
      <template #default="scope">
        <el-radio-group
          v-model="scope.row.devServerName"
          @change="(value: string) => updateSelectedDevServer(value, scope.row)"
        >
          <el-radio
            v-for="item in devServerList"
            :key="item.name"
            :value="`${item.name}`"
            :title="item.ip"
            border
            size="small"
          >{{ item.name }}</el-radio>
        </el-radio-group>
      </template>
    </el-table-column>
    <el-table-column label="操作">
      <template #default="scope">
        <el-button
          type="success"
          v-if="scope.row.status === 'stop'"
          :loading="loadingMap[scope.row.port]"
          @click="handleStart(scope.row)"
        >启动</el-button>
        <el-button
          type="info"
          v-else
          :loading="loadingMap[scope.row.port]"
          @click="handleStop(scope.row)"
        >停止</el-button>
        <el-button
          type="danger"
          :loading="loadingMap[scope.row.port]"
          @click="handleDelete(scope.row)"
        >删除</el-button>
      </template>
    </el-table-column>
  </el-table>
  <add-env
    ref="addEnvRef"
    :modelValue="modelValue"
    :apiPrefix="apiPrefix"
    @refreshList="refreshList"
  />
</template>

<script lang="ts" setup>
import addEnv from './AddEnv.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import type { DevServerInterface, EnvItemInterface, ListResponse } from 'envm'
import { fetchData } from '@/utils'

const apiPrefix = 'dev-manage-api'

const tableData = ref<EnvItemInterface[]>([])

const devServerList = ref<DevServerInterface[]>([])

const loadingMap = ref<{ [key: string]: unknown }>({}) // 存储每行的 loading 状态

const refreshLoading = ref(false)

const modelValue = ref<EnvItemInterface>({
  name: '',
  description: '',
  port: 0,
  devServerId: '',
  ip: '',
  homePage: '',
  status: 'stopped',
})

const addEnvRef = ref()

const handleAddEnv = () => {
  // 使用 $refs 调用子组件方法
  if (addEnvRef.value) {
    addEnvRef.value.showDialog()
  }
}

/**
 * 获取环境列表
 *
 */
const getEnvList = () => {
  refreshLoading.value = true
  fetchData<ListResponse<EnvItemInterface>>(`${apiPrefix}/env/getlist`)
    .then((res) => {
      console.log(res)
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
  fetch(`${apiPrefix}/server/list`)
    .then((res) => {
      return res.json()
    })
    .then((res) => {
      console.log(res)
      devServerList.value = res.list
    })
}

onMounted(() => {
  getEnvList()
  getDevServerList()
  startWs()
})

const handleStart = (rowData: EnvItemInterface) => {
  updateStatus('start', rowData)
}
const handleStop = (rowData: EnvItemInterface) => {
  updateStatus('stop', rowData)
}

const handleDelete = (rowData: EnvItemInterface) => {
  ElMessageBox.confirm(`确定删除环境 ${rowData.name} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      fetch(`${apiPrefix}/env/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // 必须设置
        },
        body: JSON.stringify(rowData),
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
          getEnvList()
        })
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const updateStatus = (action: string, rowData: EnvItemInterface) => {
  loadingMap.value[rowData.port] = true

  fetch(`${apiPrefix}/server/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // 必须设置
    },
    body: JSON.stringify(rowData),
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
      getEnvList()
    })
    .finally(() => {
      loadingMap.value[rowData.port] = false
    })
}

const updateSelectedDevServer = (devServerName: string, rowData: EnvItemInterface) => {
  fetch(`${apiPrefix}/update-dev-server-id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // 必须设置
    },
    body: JSON.stringify({
      name: rowData.name,
      port: rowData.port,
      devServerName,
    }),
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
      getEnvList()
    })
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
