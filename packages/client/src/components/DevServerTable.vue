<script setup lang="ts">
import { apiPrefix, fetchData } from '@/utils'
import type { DevServerModel, ListResponse } from '@envm/schemas'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import EditServer from './EditServer.vue'

const devServerList = ref<DevServerModel[]>([])

const editServerRef = ref()
/**
 * 获取开发服务器列表
 *
 */
const getDevServerList = () => {
  return fetchData<ListResponse<DevServerModel>>(`${apiPrefix}/server/list`).then((res) => {
    devServerList.value = res?.list || []
  })
}

/**
 * 删除数据
 * @param rowData
 */
const handleDelete = (rowData: DevServerModel) => {
  ElMessageBox.confirm(`确定删除DevServer【${rowData.name || rowData.devServerUrl}】吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      return fetchData({
        url: `${apiPrefix}/server`,
        method: 'DELETE',
        params: rowData,
      }).then(() => {
        ElMessage.success('删除成功')
        getDevServerList()
      })
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

const handleModify = (rowData: DevServerModel) => {
  editServerRef.value.showDialog(rowData)
}
onMounted(() => {
  getDevServerList()
})

const refresh = () => {
  return getDevServerList()
}
defineExpose({
  refresh,
})
</script>
<template>
  <el-table
    :data="devServerList"
    style="width: 100%"
    stripe
  >
    <el-table-column
      prop="name"
      label="DevServer名称"
      width="200"
    />
    <el-table-column
      prop="devServerUrl"
      label="DevServer地址"
      width="200"
    />
    <el-table-column label="操作">
      <template #default="scope">
        <el-button
          type="primary"
          plain
          @click="handleModify(scope.row)"
        >修改</el-button>
        <el-button type="danger" @click="handleDelete(scope.row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
  <EditServer ref="editServerRef" @refreshList="refresh"></EditServer>
</template>
