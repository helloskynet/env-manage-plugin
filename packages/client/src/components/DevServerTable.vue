<script setup lang="ts">
import { apiPrefix, fetchData } from '@/utils'
import type { DevServerModel, ListResponse } from '@envm/schemas'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import DevServerEdit from './DevServerEdit.vue'
import { DocumentCopy, Edit, Delete } from '@element-plus/icons-vue'
import { VueDraggable } from 'vue-draggable-plus'

const devServerList = ref<DevServerModel[]>([])
const refreshLoading = ref(false)

const devServerEditRef = ref()
/**
 * 获取开发服务器列表
 *
 */
const getDevServerList = () => {
  refreshLoading.value = true
  return fetchData<ListResponse<DevServerModel>>(`${apiPrefix}/server/list`)
    .then((res) => {
      devServerList.value = res?.list || []
    })
    .finally(() => {
      refreshLoading.value = false
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

// ====================== 拖拽修复开始 ======================

const onEnd = () => {
  saveSortOrder(devServerList.value)
}

// 保存排序到后端
const saveSortOrder = (list: DevServerModel[]) => {
  const orders = list.map((item, index) => ({
    id: item.id,
    sortOrder: index,
  }))
  fetchData({
    url: `${apiPrefix}/server/sort`,
    method: 'PUT',
    data: { orders },
  })
    .then(() => ElMessage.success('排序保存成功'))
    .catch(() => {
      ElMessage.error('排序保存失败')
      getDevServerList()
    })
}
// ====================== 拖拽修复结束 ======================

const handleModify = (rowData: DevServerModel) => {
  devServerEditRef.value.showDialog(rowData)
}

const handleCopy = (rowData: DevServerModel) => {
  const newServer = { ...rowData }
  newServer.name = `${newServer.name}-副本`
  devServerEditRef.value.showDialog(newServer, true)
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
  <VueDraggable
    v-model="devServerList"
    :animation="150"
    target="tbody"
    @end="onEnd"
  >
    <el-table
      :data="devServerList"
      style="width: 100%"
      stripe
      row-key="id"
      v-loading="refreshLoading"
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
            :icon="Edit"
            title="编辑"
            circle
            @click="handleModify(scope.row)"
          ></el-button>
          <el-button
            type="primary"
            :icon="DocumentCopy"
            title="复制"
            circle
            @click="handleCopy(scope.row)"
          ></el-button>
          <el-button
            type="danger"
            :icon="Delete"
            title="删除"
            circle
            @click="handleDelete(scope.row)"
          ></el-button>
        </template>
      </el-table-column>
    </el-table>
  </VueDraggable>
  <dev-server-edit
    ref="devServerEditRef"
    @refreshList="refresh"
  ></dev-server-edit>
</template>
