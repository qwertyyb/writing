<template>
  <div class="file-view">
    <el-form inline>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="query.timeRange"
          type="daterange"
          range-separator="到"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </el-form-item>
      <el-form-item label="文件类型">
        <el-input v-model="query.mimetype"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary">查询</el-button>
      </el-form-item>
    </el-form>
    <el-button size="small" @click="selectAllFreeFiles">选中所有未关联的文件</el-button>
    <el-button size="small" @click="removeSelected" type="danger">删除选中的文件</el-button>
    <el-table :data="list" ref="tableRef">
      <el-table-column type="selection" width="55" />
      <el-table-column label="预览">
        <template #default="scope">
          <img :src="scope.row.url" class="file-preview image-preview" alt="" >
        </template>
      </el-table-column>
      <el-table-column label="文件名" align="center" prop="name"></el-table-column>
      <el-table-column label="文件类型" align="center" prop="mimetype" width="120"></el-table-column>
      <el-table-column label="创建时间" align="center" prop="createdAt"></el-table-column>
      <el-table-column label="关联文章" align="center">
        <template #default="scope">
          <template v-if="!scope.row.documents.length">-</template>
          <el-link type="primary" :href="`/admin/document/${item.id}`"
            v-for="item in scope.row.documents"
            :key="item.id"
          >{{ item.title }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button type="danger" size="small"
            :disabled="!!scope.row.documents.length"
            @click="removeRow(scope.row, scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as R from 'ramda';
import { service } from '@/services';
import { ElMessage, ElMessageBox, ElTable } from 'element-plus';

type RowData = { name: string, createdAt: string, documents: {id:number, title:string}[] }

const query = ref<{ timeRange: [Date?, Date?], mimetype: string }>({
  timeRange: [],
  mimetype: ''
})
const list = ref<RowData[]>([])
const tableRef = ref<InstanceType<typeof ElTable>>()

const refresh = async () => {
  const [start, end] = query.value.timeRange
  const res = await service.fileService.check({ start, end, mimetype: query.value.mimetype })
  list.value = res.data
}

const selectAllFreeFiles = () => {
  list.value.forEach(row => {
    if (!row.documents.length) {
      tableRef.value?.toggleRowSelection(row, true)
    }
  })
}

const removeSelected = async () => {
  const selectedRows = (tableRef.value?.getSelectionRows() ?? []) as RowData[]
  if (!selectedRows.length) return ElMessage.warning('未选中任何文件')
  if (selectedRows.some(item => item.documents.length)) return ElMessage.error('有文件正在文档中使用，无法删除');
  await ElMessageBox.confirm('确认删除？删除后，文档中将无法显示此内容', { cancelButtonText: '取消', confirmButtonText: '删除' })
  const { data } = await service.fileService.remove(selectedRows.map(item => item.name))
  ElMessage.success('已删除' + data.count + '个文件')
  refresh()
}

const removeRow = async (row: RowData, index: number) => {
  await ElMessageBox.confirm('确认删除？删除后，文档历史中将无法恢复此文件', { cancelButtonText: '取消', confirmButtonText: '删除' })
  const { data } = await service.fileService.remove([row.name])
  ElMessage.success('已删除' + data.count + '个文件')
  list.value = R.remove(index, 1, list.value)
}

refresh()

</script>

<style lang="less" scoped>
.file-view {
  padding: 20px;
}
.file-preview.image-preview {
  width: 60px;
  height: auto;
}
</style>