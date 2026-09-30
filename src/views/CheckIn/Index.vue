<template>
  <div class="island-page">
    <div class="blue-zone">
      <section class="welcome top-part">
        <!-- 可接入天气API -->
        <span class="sub-title">今日岛屿天气晴朗</span> 
        <h1 class="main-title">慢慢来 也是一种前进</h1>
      </section>
    </div>

    <div class="white-zone">
      <section class="welcome bottom-part">
        <p class="desc-text">记录身体的每一点轻盈变化吧</p>
      </section>

      <!-- 统计卡片 -->
      <section class="stats-grid">
        <div class="stat-card yellow-card">
          <span>今日体重</span>
          <strong>{{ latestWeight }} <i>kg</i></strong>
          <small>{{ records.length > 0 ? '已完成今日记录' : '等待今日打卡' }}</small>
        </div>
        <div class="stat-card teal-card">
          <span>累计变化</span>
          <strong>{{ totalChange }} <i>kg</i></strong>
          <small>从起始记录计算</small>
        </div>
      </section>

      <!-- 变化折线图 -->
      <section class="island-section">
        <h2 class="section-title">变化趋势</h2>
        <div class="trend-card">
          <div class="trend-top">
            <span>最近 {{ records.length }} 次记录</span>
            <div class="goal-tag" v-if="goalProgress > 0">
              目标 {{ goalProgress }}%
            </div>
          </div>
          
          <div v-if="records.length" class="chart-wrap">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="体重趋势图">
              <polygon :points="`0,100 ${chartPoints} 100,100`" fill="rgba(255,255,255,.25)"/>
              <polyline :points="chartPoints" fill="none" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/>
            </svg>
            <div class="chart-labels">
              <span>{{ records[records.length - 1]?.date.slice(5) }}</span>
              <span>{{ records[0]?.date.slice(5) }}</span>
            </div>
          </div>
          <div v-else class="empty-state">开始打卡后，变化曲线会出现。</div>
        </div>
      </section>

      <!-- 每日打卡表单 -->
      <section class="island-section">
        <h2 class="section-title">每日打卡</h2>
        
        <div class="checkin-card">
          <p class="form-hint">把今天的努力收进小岛日记</p>
          
          <van-form @submit="onSubmit">
            <van-cell-group inset class="custom-cell-group">
              <van-field v-model="formDate" name="date" label="日期" readonly />
              <van-field
                v-model="formWeight"
                name="weight"
                label="体重(kg)"
                type="number"
                placeholder="例如 58.6"
                :rules="[{ required: true, message: '请填写体重' }]"
              />
              <van-field
                v-model="formDiary"
                name="diary"
                label="小日记"
                type="textarea"
                rows="2"
                autosize
                placeholder="每天对自己说的话，备注..."
              />
            </van-cell-group>
            
            <div class="photo-row">
              <div class="photo-upload-box">
                <van-uploader 
                  v-model="fileList" 
                  :max-count="1" 
                  accept="image/*"
                  capture="camera"
                  upload-text="拍照打卡"
                />
                <div class="photo-tip">仅保存在本机</div>
              </div>
              <p class="photo-slogan">留下一张照片<br />让改变看得见</p>
            </div>
            
            <div class="form-actions">
              <van-button round block type="primary" native-type="submit" class="submit-btn">
                完成打卡
              </van-button>
            </div>
          </van-form>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showNotify } from '@/utils/notify'
import { getRecords, addRecord, globalProfile } from '@/utils/storage'
import type { RecordItem } from '@/utils/storage'

const formWeight = ref('')
const formDiary = ref('')
const fileList = ref<any[]>([]) 

const getTodayDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const formDate = ref(getTodayDate())

const records = ref<RecordItem[]>([])

onMounted(async() => {
  records.value = await getRecords()
})

// 计算今日最新体重
const latestWeight = computed(() => {
  if (records.value.length === 0) return '—'
  return records.value[0].weight
})

// 计算累计体重变化
const totalChange = computed(() => {
  if (records.value.length < 2) return '0.0'
  const latest = records.value[0].weight
  const initial = records.value[records.value.length - 1].weight
  const diff = latest - initial
  return (diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1))
})

// 计算 SVG 折线图坐标
const chartPoints = computed(() => {
  const values = [...records.value].reverse() 
  if (!values.length) return ''
  
  const weights = values.map(item => item.weight)
  const min = Math.min(...weights) - 0.3 
  const max = Math.max(...weights) + 0.3
  
  return values.map((item, index) => {
    const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100
    const y = max === min ? 50 : 92 - ((item.weight - min) / (max - min)) * 76
    return `${x},${y}`
  }).join(' ')
})

// 计算目标进度百分比
const goalProgress = computed(() => {
  const initial = Number(globalProfile.value.initialWeight) || 0
  const goal = Number(globalProfile.value.goalWeight) || 0
  
  if (!initial || !goal || goal >= initial) return 0

  const latestWeight = records.value.length > 0 
    ? Number(records.value[0].weight) 
    : initial

  const lostWeight = initial - latestWeight
  const targetWeightLoss = initial - goal

  if (lostWeight <= 0) return 0

  let percentage = Math.floor((lostWeight / targetWeightLoss) * 100)
  
  if (percentage > 100) percentage = 100

  return percentage
})

// 提交打卡
const onSubmit = async (values: any) => {
  if (fileList.value.length === 0) {
    showNotify('打卡异常：请拍一张打卡照片！', 'danger')
    return
  }

  const imageUrl = fileList.value[0].content || '@/assets/default-avatar.png'

  await addRecord({
    userName: globalProfile.value.name || '未命名用户',
    date: values.date,
    weight: Number(values.weight),
    diary: values.diary || '今天完成了打卡！',
    imageUrl: imageUrl
  })

  records.value = await getRecords()

  showNotify('打卡成功，继续保持！', 'success')
  
  formWeight.value = ''
  formDiary.value = ''
  fileList.value = []
}
</script>

<style scoped>
.island-page { 
  background: #e8f4f3;
  min-height: 100%;
}

.blue-zone {
  background-color: #a7dedf;
  padding: 20px 20px 25px 20px;
}

.white-zone {
  padding: 0 20px 20px 20px;
}

.island-page * {
  text-shadow: none !important;
}

.welcome {
  display: flex;
  flex-direction: column;
}

.welcome.top-part {
  margin-bottom: 0;
}
.welcome.bottom-part {
  margin-top: 0;
}

.sub-title {
  color: #794f27;
  font-size: 14px;
}

.main-title {
  color: #333;
  font-size: 24px; margin: 8px 0 0 0;
}

.desc-text {
  color: #794f27;
  margin-top: 15px; font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px; margin-top: 20px;
}

.stat-card { padding: 16px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.stat-card span {
  font-size: 12px;
  color: #666;
}

.stat-card strong {
  font-size: 22px;
  margin: 8px 0;
  color: #333;
}

.stat-card strong i {
  font-size: 12px;
  font-style: normal;
  color: #666;
}

.stat-card small {
  font-size: 11px;
  color: #794f27;
}

.yellow-card {
  background-color: #f7cd67;
}

.teal-card {
  background-color: #82d5bb;
}

.section-title {
  color: #4CAF50;
  font-size: 18px;
  margin: 24px 0 12px 0;
}

.checkin-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.form-hint {
  font-size: 13px;
  color: #999;
  margin-bottom: 16px;
  text-align: center;
}

.custom-cell-group {
  margin: 0;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.van-cell) {
  background-color: #fafafa;
}

.photo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding: 0 10px;
}

.photo-upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.photo-tip {
  font-size: 11px;
  color: #b5a494;
  margin-top: 4px;
}

.photo-slogan {
  font-weight: bold;
  font-size: 1.1em;
  color: #7f6e5d;
  text-align: right;
  line-height: 1.4;
}

.form-actions {
  margin-top: 24px;
}

.submit-btn {
  background-color: #7bc63d;
  border-color: #7bc63d;
}

.trend-card {
  background: linear-gradient(135deg, #74b9ff, #0984e3);
  border-radius: 16px;
  padding: 16px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(9, 132, 227, 0.2);
}

.trend-top {
  display: flex;
  justify-content: space-between;
  align-items: center; 
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 16px;
}

.chart-wrap {
  position: relative;
  height: 100px;
}

.chart-wrap svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  opacity: 0.8;
  margin-top: 8px;
  color: #333333;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 30px 0;
  font-size: 14px;
  opacity: 0.8;
}

.goal-tag {
  background-color: #fffbe8; 
  color: #ff976a; 
  font-size: 12px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 20px; 
}
</style>