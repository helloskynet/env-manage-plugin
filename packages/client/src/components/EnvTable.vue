<template>
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
      prop="apiBaseUrl"
      label="API服务地址"
      width="180"
    />
    <el-table-column
      prop="index"
      label="首页地址"
      show-overflow-tooltip
    >
      <template #default="scope">
        <el-link
          :disabled="scope.row.status === 'stopped'"
          type="primary"
          :href="scope.row.index"
          target="_blank"
        >{{ scope.row.index }}</el-link>
      </template>
    </el-table-column>
    <el-table-column prop="port" label="绑定端口" />
    <el-table-column prop="status" label="状态">
      <template #default="scope">
        <el-tag v-if="scope.row.status === 'stopped'" type="danger">未启动</el-tag>
        <el-tag v-else type="success">已启动</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="devServerId" label="DevServer">
      <template #default="scope">
        <el-radio-group
          v-model="scope.row.devServerId"
          @change="(value: string) => updateSelectedDevServer(value, scope.row)"
        >
          <el-radio
            v-for="item in devServerList"
            :key="item.id"
            :value="item.id"
            :title="item.devServerUrl"
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
          v-if="scope.row.status === 'stopped'"
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
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import type { DevServerModel, EnvModel, ListResponse } from '@envm/schemas'
import { fetchData } from '@/utils'

const apiPrefix = 'dev-manage-api'

const tableData = ref<EnvModel[]>([])

const devServerList = ref<DevServerModel[]>([])

const loadingMap = ref<{ [key: string]: unknown }>({}) // 存储每行的 loading 状态

const refreshLoading = ref(false)

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
})

const handleStart = (rowData: EnvModel) => {
  updateStatus('start', rowData)
}
const handleStop = (rowData: EnvModel) => {
  updateStatus('stop', rowData)
}

const handleDelete = (rowData: EnvModel) => {
  ElMessageBox.confirm(`确定删除环境 ${rowData.name} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      return fetchData({
        url: `${apiPrefix}/env/delete`,
        method: 'POST',
        params: rowData,
      }).then(() => {
        ElMessage.success('删除成功')
        getEnvList()
      })
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const updateStatus = (action: string, rowData: EnvModel) => {
  loadingMap.value[rowData.port] = true

  fetch(`${apiPrefix}/env/${action}`, {
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

const updateSelectedDevServer = (devServerId: string, rowData: EnvModel) => {
  fetchData({
    url: `${apiPrefix}/env/update`,
    data: {
      id: rowData.id,
      devServerId,
    },
  }).then(() => {
    ElMessage.success('更新成功')
    getEnvList()
  })
}
</script>
