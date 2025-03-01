<template>
  <el-button type="success" @click="refreshList" :loading="refreshLoading">刷新</el-button>
  <el-table :data="tableData" style="width: 100%">
    <el-table-column prop="name" label="环境名称" width="100" />
    <el-table-column prop="target" label="环境代理详情" width="180" />
    <el-table-column prop="index" label="首页地址" show-overflow-tooltip>
      <template #default="scope">
        <el-link
          :disabled="scope.row.status === 'stop'"
          type="primary"
          :href="scope.row.index"
          target="_blank"
          >{{ scope.row.index }}</el-link
        >
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
          @change="(value) => updateSelectedDevServer(value, scope.row)"
        >
          <el-radio
            v-for="item in devServerList"
            :key="item.name"
            :value="`${item.name}`"
            :title="item.target"
            border
            size="small"
            >{{ item.name }}</el-radio
          >
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
          >启动</el-button
        >
        <el-button
          type="danger"
          v-else
          :loading="loadingMap[scope.row.port]"
          @click="handleStop(scope.row)"
          >停止</el-button
        >
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const apiPrefix = 'dev-manage-api'

let tableData = ref([])

let devServerList = ref([])

let loadingMap = ref({}) // 存储每行的 loading 状态

let refreshLoading = ref(false)
/**
 * 获取环境列表
 *
 */
const getEnvList = () => {
  refreshLoading.value = true
  fetch(`${apiPrefix}/getlist`)
    .then((res) => {
      return res.json()
    })
    .then((res) => {
      console.log(res)
      tableData.value = res.list.map((item) => {
        return {
          ...item,
          index: `${location.protocol}//${location.hostname}:${item.port}${item.indexPage}`,
        }
      })
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
  fetch(`${apiPrefix}/get-dev-server-list`)
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
})

const handleStart = (rowData) => {
  updateStatus({
    action: 'start',
    name: rowData.name,
    port: rowData.port,
  })
}
const handleStop = (rowData) => {
  const rowPort = rowData.port
  if (location.port == rowPort) {
    ElMessage.error('不能停止当前环境')
    return
  }
  updateStatus({
    action: 'stop',
    name: rowData.name,
    port: rowData.port,
  })
}

const updateStatus = (body) => {
  loadingMap.value[body.port] = true

  fetch(`${apiPrefix}/manage-server`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // 必须设置
    },
    body: JSON.stringify(body),
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
      loadingMap.value[body.port] = false
    })
}

const updateSelectedDevServer = (devServerName, rowData) => {
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
</script>
