<!-- 记录界面 -->
<template>
  <div class="records-page">
    <div class="page-header">
      <h2>小岛日记</h2>
      <p>记录你的每一次蜕变</p>
    </div>

    <!-- 记录展示 -->
    <div class="record-list" v-if="currentPageData.length > 0">
      <div v-for="item in currentPageData" :key="item.id" class="record-card">
        <div class="card-header">
          <div class="user-info">
            <van-image round width="32px" height="32px" fit="cover" :src="globalProfile.avatar || DEFAULT_AVATAR" />
            <span class="user-name">{{ globalProfile.name || '未命名用户' }}</span>
          </div>
          <span class="record-date">{{ item.date }}</span>
        </div>

        <div class="card-body">
          <div class="record-weight">体重：<strong>{{ item.weight }}</strong> kg</div>
          <p class="record-diary">{{ item.diary }}</p>
          
          <van-image class="record-image" fit="cover" radius="8px" :src="item.imageUrl" @click="previewImage(item.imageUrl)" />
        </div>

        <div class="card-footer">
          <van-button size="small" icon="edit" plain type="primary" round @click="openEditModal(item)">修改记录</van-button>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-box">暂无打卡记录，快去打卡吧！</div>

    <div v-if="totalCount > 0" class="pagination-container">
      <van-pagination
        v-model="currentPage"
        :total-items="totalCount"
        :items-per-page="pageSize"
        force-ellipses
        @change="onPageChange"
      >
        <template #prev-text><van-icon name="arrow-left" /></template>
        <template #next-text><van-icon name="arrow" /></template>
      </van-pagination>
    </div>

    <!-- 修改记录 -->
    <van-popup v-model:show="showEditPopup" position="bottom" round :style="{ height: '80%' }">
      <div class="edit-popup-content">
        <h3 class="popup-title">修改打卡记录</h3>
        <van-form @submit="onSaveEdit">
          <van-cell-group inset>
            <van-field v-model="editForm.date" name="date" label="日期" type="date" />
            <van-field v-model="editForm.weight" name="weight" label="体重(kg)" type="number" :rules="[{ required: true, message: '请填写体重' }]" />
            <van-field v-model="editForm.diary" name="diary" label="小日记" type="textarea" rows="3" autosize />
          </van-cell-group>
          <div class="edit-photo-section">
            <span class="photo-label">打卡照片</span>
            <van-uploader v-model="editForm.fileList" :max-count="1" />
          </div>
          <div class="popup-actions">
            <van-button round block type="default" @click="closeEditModal" style="margin-bottom: 12px;">取消</van-button>
            <van-button round block type="primary" native-type="submit">保存修改</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ImagePreview } from 'vant'
import { showNotify } from '@/utils/notify'
import { getPagedRecords, getRecordsCount, updateRecord, globalProfile, DEFAULT_AVATAR } from '@/utils/storage'
import type { RecordItem } from '@/utils/storage'

const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = 5
const currentPageData = ref<RecordItem[]>([])
const loadCurrentPageData = async () => {
  totalCount.value = await getRecordsCount()
  currentPageData.value = await getPagedRecords(currentPage.value, pageSize)
}

onMounted(() => {
  loadCurrentPageData()
})

const onPageChange = async () => {
  await loadCurrentPageData()
  const mainScrollBox = document.querySelector('.app-main')
  if (mainScrollBox) {
    mainScrollBox.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const previewImage = (url: string) => {
  ImagePreview([url])
}

const showEditPopup = ref(false)
const editForm = ref({
  id: 0,
  date: '',
  weight: 0,
  diary: '',
  fileList: [] as any[]
})

const openEditModal = (item: RecordItem) => {
  editForm.value = {
    id: item.id || 0,
    date: item.date,
    weight: item.weight,
    diary: item.diary,
    fileList: [{ url: item.imageUrl, isImage: true }]
  }
  showEditPopup.value = true
}

const closeEditModal = () => {
  showEditPopup.value = false
  showNotify('已取消修改', 'primary')
}

const onSaveEdit = async (values: any) => {
  if (editForm.value.fileList.length === 0) {
    showNotify('请至少保留一张图片', 'danger')
    return
  }
  
  const fileItem = editForm.value.fileList[0]
  const newImageUrl = fileItem.content || fileItem.url

  const updatedItem: RecordItem = {
    id: editForm.value.id,
    userName: globalProfile.value.name || '未命名用户',
    date: values.date,
    weight: Number(values.weight),
    diary: values.diary,
    imageUrl: newImageUrl
  }

  // 数据库处理
  await updateRecord(updatedItem)
  await loadCurrentPageData()

  showEditPopup.value = false
  showNotify('修改成功！', 'success')
}
</script>

<style scoped>
.records-page {
  background-color: #f7f8fa;
  min-height: 100%;
  padding-bottom: 40px;
}

.page-header {
  padding: 20px 20px 10px 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
  font-size: 22px;
}

.page-header p {
  margin: 6px 0 0 0;
  color: #999;
  font-size: 14px;
}

.record-list {
  padding: 0 16px;
}

.empty-box {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.record-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  margin-left: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.record-date {
  font-size: 12px;
  color: #999;
}

.card-body {
  margin-bottom: 12px;
}

.record-weight {
  font-size: 14px;
  color: #7bc63d;
  margin-bottom: 8px;
}

.record-weight strong {
  font-size: 18px;
}

.record-diary {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
  margin-bottom: 12px;
}

.record-image {
  width: 100px;
  height: 100px;
  cursor: pointer;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f5f5f5;
  padding-top: 12px;
}

.pagination-container {
  margin: 30px 16px 20px 16px;
  background: #fff;
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  display: flex;
  justify-content: center;
}

.edit-popup-content {
  padding: 20px;
  background-color: #f7f8fa;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-title {
  margin: 0 0 20px 0;
  text-align: center;
  color: #333;
}

.edit-photo-section {
  padding: 16px;
  background: #fff;
  margin: 16px;
  border-radius: 12px;
}

.photo-label {
  display: block;
  font-size: 14px;
  color: #323233;
  margin-bottom: 12px;
}

.popup-actions {
  margin: 24px 16px;
  }
</style>