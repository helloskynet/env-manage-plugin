<template>
  <el-table :data="tableData" style="width: 100%">
    <el-table-column prop="name" label="环境名称" width="180" />
    <el-table-column prop="target" label="环境代理详情" width="180" />
    <el-table-column prop="address" label="首页地址" />
    <el-table-column prop="port" label="端口" />
    <el-table-column prop="status" label="状态" />
    <el-table-column label="操作">
      <template #default="scope">
        <el-button type="success" v-if="scope.row.status === 'stop'" @click="handleStart(scope.row)"
          >启动</el-button
        >
        <el-button type="danger" v-else @click="handleStop(scope.row)">停止</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const apiPrefix = 'dev-manage-api'

let tableData = ref([])
/**
 * 获取环境列表
 *
 */
const getEnvList = () => {
  fetch(`${apiPrefix}/getlist`)
    .then((res) => {
      return res.json()
    })
    .then((res) => {
      console.log(res)
      tableData.value = res.list
    })
}

onMounted(() => {
  getEnvList()
})

const handleStart = (rowData) => {
  updateStatus({
    action: 'start',
    name: rowData.name,
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
  })
}

const updateStatus = (body) => {
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
}
</script>
