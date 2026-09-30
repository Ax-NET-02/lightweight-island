<!-- 个人中心 -->
<template>
  <div class="profile-page">
    <!-- 顶部个人名片 -->
    <div class="profile-card">
      <div class="user-main-info">
        <van-uploader v-model="avatarFile" :max-count="1" class="avatar-uploader" :after-read="onAvatarChange">
          <van-image
            round
            width="4.5rem"
            height="4.5rem"
            fit="cover"
            :src="globalProfile.avatar || DEFAULT_AVATAR"
            class="user-avatar"
          />
        </van-uploader>
        
        <div class="info-text">
          <h2 class="user-name">{{ globalProfile.name || '轻盈岛民' }}</h2>
          <p class="user-sign">{{ globalProfile.signature || '开启全新的轻盈之旅' }}</p>
          <van-tag type="success" round class="level-tag">{{ accountLevel }}</van-tag>
        </div>
        
        <div class="edit-arrow-zone" @click="openEditProfile">
          <van-icon name="arrow" color="rgba(255,255,255,0.8)" size="20" />
        </div>
      </div>
    </div>

    <!-- 成就墙 -->
    <div class="section-title">我的成就徽章</div>
    <div class="action-card achievement-card">
      <van-grid :column-num="3" :border="false">
        <van-grid-item v-for="ach in achievements" :key="ach.id">
          <div class="ach-item" :class="{ 'is-locked': !ach.unlocked }">
            <div class="ach-icon" :style="{ backgroundColor: ach.unlocked ? ach.color : '#ebedf0' }">
              <van-icon :name="ach.icon" color="#fff" size="24" />
            </div>
            <div class="ach-title">{{ ach.title }}</div>
            <div class="ach-desc">{{ ach.desc }}</div>
          </div>
        </van-grid-item>
      </van-grid>
    </div>

    <!-- 数据备份与迁移 -->
    <div class="section-title">数据备份与迁移</div>
    <div class="action-card">
      <div class="action-item" @click="exportData">
        <div class="action-left">
          <van-icon name="share-o" size="20" color="#1989fa" />
          <span>导出并分享数据备份</span>
        </div>
        <van-icon name="arrow" color="#969799" />
      </div>
      <div class="action-divider"></div>
      <label class="action-item">
        <div class="action-left">
          <van-icon name="upgrade" size="20" color="#07c160" />
          <span>导入数据 (恢复旧设备备份)</span>
        </div>
        <van-icon name="arrow" color="#969799" />
        <input type="file" accept=".json" style="display: none;" @change="importData" />
      </label>
    </div>

    <!-- 出厂设置 -->
    <div class="section-title">危险区域</div>
    <div class="action-card danger-card">
      <div class="action-item" @click="onConfirmClearRecords">
        <div class="action-left">
          <van-icon name="delete-o" size="20" color="#ee0a24" />
          <span style="color: #ee0a24;">清除所有打卡数据</span>
        </div>
        <van-icon name="arrow" color="#969799" />
      </div>
      <div class="action-divider"></div>
      <div class="action-item" @click="onConfirmResetProfile">
        <div class="action-left">
          <van-icon name="revoke" size="20" color="#ee0a24" />
          <span style="color: #ee0a24;">重置个人资料</span>
        </div>
        <van-icon name="arrow" color="#969799" />
      </div>
    </div>

    <!-- 个人资料编辑 -->
    <van-popup
      v-model:show="showEditProfilePopup"
      position="bottom"
      round
      closeable
      :style="{ height: '85%' }"
    >
      <div class="popup-content">
        <h3 class="popup-title">基本信息与目标设置</h3>
        <van-form @submit="onSaveProfile" class="profile-form">
          <van-cell-group inset>
            <van-field v-model="formCopy.name" name="name" label="用户名称" placeholder="请输入名称" :rules="[{ required: true, message: '请填写名称' }]" />
            <van-field v-model="formCopy.signature" name="signature" label="个性签名" placeholder="输入一句话鼓励自己" />
            <van-field v-model="formCopy.age" name="age" label="年龄" type="digit" placeholder="请输入年龄" />
            <van-field v-model="formCopy.height" name="height" label="身高(cm)" type="number" placeholder="例如 175" />
            <van-field v-model="formCopy.initialWeight" name="initialWeight" label="初始体重(kg)" type="number" placeholder="例如 70" />
            <van-field v-model="formCopy.goalWeight" name="goalWeight" label="目标体重(kg)" type="number" placeholder="例如 60" />
          </van-cell-group>
          <div class="btn-container">
            <van-button round block type="primary" native-type="submit" class="save-btn">保存个人资料</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Dialog } from 'vant'
import { showNotify } from '@/utils/notify'
import { db } from '@/db/db'

import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

import { 
  DEFAULT_AVATAR, globalProfile, getProfile, saveProfileData, getRecords, clearAllData, resetProfileData, 
  type UserProfile, type RecordItem 
} from '@/utils/storage'

const formCopy = ref<UserProfile>({ ...globalProfile.value })
const avatarFile = ref<any[]>([])
const userRecords = ref<RecordItem[]>([])

const showEditProfilePopup = ref(false)

onMounted(async () => {
  await getProfile()
  formCopy.value = { ...globalProfile.value }
  userRecords.value = await getRecords()
})

watch(() => globalProfile.value, (newVal) => {
  formCopy.value = { ...newVal }
}, { deep: true })

const openEditProfile = () => {
  formCopy.value = { ...globalProfile.value }
  showEditProfilePopup.value = true
}

const weightLostVal = computed(() => {
  const initialWeight = Number(globalProfile.value.initialWeight) || 0
  const latestWeight = userRecords.value.length > 0 
    ? Number(userRecords.value[0].weight) 
    : initialWeight
  return initialWeight - latestWeight
})

const accountLevel = computed(() => {
  const points = weightLostVal.value > 0 ? Math.floor(weightLostVal.value * 10) : 0
  if (points >= 200) return `Lv.7 涅槃岛主 (经验:${points})`
  if (points >= 150) return `Lv.6 极光追寻者 (经验:${points})`
  if (points >= 100) return `Lv.5 破风航海家 (经验:${points})`
  if (points >= 70)  return `Lv.4 蜕变见证者 (经验:${points})`
  if (points >= 50)  return `Lv.3 轻盈巡游者 (经验:${points})`
  if (points >= 30)  return `Lv.2 乘风破浪者 (经验:${points})`
  if (points >= 10)  return `Lv.1 启航探险家 (经验:${points})`
  return `Lv.0 迷失的旅人 (经验:${points})`
})

const achievements = computed(() => {
  const days = userRecords.value.length
  const lost = weightLostVal.value
  return [
    { id: 1, title: '初次登岛', desc: '完成第1次打卡', icon: 'flag-o', color: '#1989fa', unlocked: days >= 1 },
    { id: 2, title: '初见成效', desc: '累计减重2kg', icon: 'smile-o', color: '#07c160', unlocked: lost >= 2 },
    { id: 3, title: '坚持不懈', desc: '累计打卡7次', icon: 'fire-o', color: '#ff976a', unlocked: days >= 7 },
    { id: 4, title: '渐入佳境', desc: '累计减重5kg', icon: 'star-o', color: '#7232dd', unlocked: lost >= 5 },
    { id: 5, title: '毅力王者', desc: '累计打卡21次', icon: 'diamond-o', color: '#ee0a24', unlocked: days >= 21 },
    { id: 6, title: '完美蜕变', desc: '累计减重10kg', icon: 'award-o', color: '#ffd21e', unlocked: lost >= 10 },
  ]
})

const onAvatarChange = async (file: any) => {
  if (file && file.content) {
    const updatedData = { ...globalProfile.value, avatar: file.content }
    await saveProfileData(updatedData)
    formCopy.value.avatar = file.content
    showNotify('头像更新成功', 'success')
  }
}

const onSaveProfile = async () => {
  await saveProfileData(formCopy.value)
  showNotify('个人资料保存成功！', 'success')
  showEditProfilePopup.value = false
}

const exportData = async () => {
  try {
    const records = await getRecords()
    const profile = await getProfile()
    const exportObj = { profile, records, exportTime: new Date().toISOString() }
    const dataStr = JSON.stringify(exportObj)
    const fileName = `lightweight_island_backup_${new Date().toISOString().slice(0, 10)}.json`

    if (Capacitor.isNativePlatform()) {
      showNotify('正在生成备份文件，请稍候...', 'primary')
      await Filesystem.writeFile({ path: fileName, data: '', directory: Directory.Cache, encoding: Encoding.UTF8 })
      const chunkSize = 1024 * 1024 
      for (let i = 0; i < dataStr.length; i += chunkSize) {
        const chunk = dataStr.slice(i, i + chunkSize)
        await Filesystem.appendFile({ path: fileName, data: chunk, directory: Directory.Cache, encoding: Encoding.UTF8 })
      }
      const fileUri = await Filesystem.getUri({ path: fileName, directory: Directory.Cache })
      await Share.share({ title: '轻盈小岛数据备份', text: '您的打卡数据备份', url: fileUri.uri })
    } else {
      const blob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const downloadAnchor = document.createElement('a')
      downloadAnchor.href = url
      downloadAnchor.download = fileName
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      URL.revokeObjectURL(url)
      showNotify('数据导出成功！', 'success')
    }
  } catch (err) {
    showNotify('导出操作未完成或失败', 'danger')
  }
}

const importData = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string
      const parsedData = JSON.parse(content)
      if (parsedData.profile) await saveProfileData(parsedData.profile)
      if (parsedData.records && parsedData.records.length > 0) {
        await db.records.clear()
        await db.records.bulkAdd(parsedData.records)
      }
      showNotify('数据导入成功，即将刷新！', 'success')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) { showNotify('导入失败：文件损坏', 'danger') }
  }
  reader.readAsText(file)
}

const onConfirmClearRecords = () => {
  Dialog.confirm({ title: '危险操作', message: '确定清空所有打卡记录？', confirmButtonColor: '#ee0a24' })
    .then(async () => { await clearAllData(); userRecords.value = []; showNotify('已清空', 'danger') })
    .catch(() => {})
}

const onConfirmResetProfile = () => {
  Dialog.confirm({ title: '重置个人资料', message: '清空头像、昵称等所有设置？', confirmButtonColor: '#ee0a24' })
    .then(async () => { await resetProfileData(); avatarFile.value = []; showNotify('已重置', 'danger') })
    .catch(() => {})
}
</script>

<style scoped>
.profile-page {
  background-color: #f7f8fa;
  min-height: 100%;
  padding: 16px;
  padding-bottom: 50px;
}

.profile-card { 
  background: linear-gradient(135deg, #a7dedf, #74b9ff); 
  border-radius: 16px; 
  padding: 20px; 
  color: #fff; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.06); 
  margin-bottom: 20px; 
}

.user-main-info {
  display: flex;
  align-items: center;
  position: relative;
}

.user-avatar {
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.info-text {
  margin-left: 16px;
  flex: 1;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #fff;
}

.user-sign {
  margin: 0 0 10px 0;
  font-size: 13px;
  opacity: 0.9;
  line-height: 1.4;
}

.level-tag { 
  background: linear-gradient(to right, #7bc63d, #82d5bb) !important; 
  color: #fff !important; 
  border: none !important; 
  box-shadow: 0 2px 6px rgba(123, 198, 61, 0.3) !important; 
  font-size: 11px !important;
  padding: 3px 10px !important; 
  font-weight: normal !important;
  border-radius: 100px !important; 
}

.edit-arrow-zone {
  padding: 12px;
  margin-right: -8px;
  cursor: pointer;
  transition: transform 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-arrow-zone:active {
  transform: scale(0.85);
}

.section-title {
  font-size: 14px;
  color: #969799;
  margin: 20px 8px 8px 8px;
}

.popup-content {
  padding: 24px 16px 16px 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f7f8fa;
}

.popup-title {
  text-align: center;
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #323233;
}

.profile-form :deep(.van-cell-group) {
  margin: 0;
  border-radius: 12px;
  overflow: hidden;
}

.btn-container {
  margin-top: 24px;
  padding: 0 16px;
}

.save-btn {
  background-color: #7bc63d;
  border-color: #7bc63d;
}

.action-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.action-item:active {
  background-color: #f2f3f5;
}

.action-left {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #323233;
}

.action-divider {
  height: 1px;
  background-color: #f7f8fa;
  margin-left: 48px;
}

.danger-card {
  border: 1px solid rgba(238, 10, 36, 0.1);
}

.achievement-card {
  padding: 8px 0;
}

.ach-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;
}

.is-locked {
  opacity: 0.4;
  filter: grayscale(100%);
}

.ach-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.ach-title {
  font-size: 13px;
  font-weight: bold;
  color: #323233;
  margin-bottom: 2px;
}

.ach-desc {
  font-size: 10px;
  color: #969799;
}
</style>