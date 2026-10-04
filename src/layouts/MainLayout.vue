<!-- 基本框架 -->
<template>
  <div class="app-container">
    <!-- 顶部区域 -->
    <header class="app-header">
      <!-- 头像与基础信息 -->
      <div class="header-left">
        <van-image
          round
          width="3rem"
          height="3rem"
          fit="cover"
          :src="globalProfile.avatar || DEFAULT_AVATAR"
        />
        <div class="user-info">
          <!-- 昵称、等级标签 -->
          <div class="name-row">
            <div class="nickname">{{ headerTitle }}</div>
            <van-tag 
              v-if="showLevelTag" 
              color="linear-gradient(to right, #7bc63d, #82d5bb)" 
              text-color="#fff" 
              round 
              class="header-level-tag"
            >
              {{ accountLevel }}
            </van-tag>
          </div>

          <!-- 个性签名 -->
          <div class="status" v-if="showSignature">
            <span class="status-dot"></span>
            <span class="status-text">{{ globalProfile.signature || '开启全新的轻盈之旅' }}</span>
          </div>
        </div>
      </div>

      <!-- BMI展示 -->
      <div class="header-right" v-if="bmiData.value > 0">
        <div class="bmi-box">
          <div class="bmi-header">
            <span class="bmi-label">BMI</span>
            <span class="bmi-value" :style="{ color: bmiData.color }">{{ bmiData.value }}</span>
          </div>
          <van-tag plain round :style="{ color: bmiData.color }">{{ bmiData.text }}</van-tag>
        </div>
      </div>
    </header>

    <!-- 中间跳转区域 -->
    <main class="app-main">
      <router-view />
    </main>

    <!-- 底部导航栏 -->
    <van-tabbar route active-color="#1989fa" inactive-color="#999">
      <van-tabbar-item replace to="/check-in" icon="edit">打卡</van-tabbar-item>
      <van-tabbar-item replace to="/records" icon="orders-o" class="guide-step-6">记录</van-tabbar-item>
      <van-tabbar-item replace to="/profile" icon="user-o" class="guide-step-1">我的</van-tabbar-item>
    </van-tabbar>
  </div>

  <GuideMask 
      @step-change="handleGuideStep" 
      @finish="handleGuideFinish" 
    />
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, watch } from 'vue'
import GuideMask from '@/components/GuideMask.vue'
import { globalProfile, getProfile, getRecords, DEFAULT_AVATAR } from '@/utils/storage'

const route = useRoute()
const router = useRouter() 
const latestWeight = ref(0)

// 监听路由变化
watch(() => route.path, async () => {
  await getProfile()
  const records = await getRecords()
  
  if (records && records.length > 0) {
    latestWeight.value = records[0].weight
  } else {
    latestWeight.value = Number(globalProfile.value.initialWeight) || 0
  }
}, { immediate: true })

const headerTitle = computed(() => {
  if (route.path === '/records') return '记录'
  if (route.path === '/profile') return '个人中心'
  return globalProfile.value.name || '未命名用户'
})

const showSignature = computed(() => {
  return route.path === '/check-in' || route.path === '/'
})

// 判断显示等级徽章
const showLevelTag = computed(() => {
  return route.path === '/check-in' || route.path === '/'
})

// 计算等级
const accountLevel = computed(() => {
  const initialWeight = Number(globalProfile.value.initialWeight) || 0
  const weightLostVal = initialWeight - latestWeight.value
  const points = weightLostVal > 0 ? Math.floor(weightLostVal * 10) : 0
  
  if (points >= 200) return `Lv.7 涅槃岛主`
  if (points >= 150) return `Lv.6 极光追寻者`
  if (points >= 100) return `Lv.5 破风航海家`
  if (points >= 70)  return `Lv.4 蜕变见证者`
  if (points >= 50)  return `Lv.3 轻盈巡游者`
  if (points >= 30)  return `Lv.2 乘风破浪者`
  if (points >= 10)  return `Lv.1 启航探险家`
  return `Lv.0 迷失的旅人`
})

// 计算BMI值
const bmiData = computed(() => {
  const heightCm = Number(globalProfile.value.height)
  const weightKg = latestWeight.value

  if (!heightCm || !weightKg) {
    return { value: 0, text: '未知', color: '#999' }
  }

  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  const bmiValue = Number(bmi.toFixed(1)) 

  if (bmiValue < 18.5) return { value: bmiValue, text: '偏瘦', color: '#1989fa' }
  if (bmiValue >= 18.5 && bmiValue <= 23.9) return { value: bmiValue, text: '正常', color: '#07c160' }
  if (bmiValue >= 24 && bmiValue <= 27.9) return { value: bmiValue, text: '偏胖', color: '#ff976a' }
  return { value: bmiValue, text: '肥胖', color: '#ee0a24' }
})

// 处理引导页跳转
const handleGuideStep = (stepIndex: number) => {
  if (stepIndex === 1) {
    router.push('/profile');
  } 
  else if (stepIndex === 2) {
    router.push('/profile');
  } 
  else if (stepIndex === 3) {
    router.push({ path: '/profile', query: { showEdit: '1' } });
  }
  else if (stepIndex === 4) {
    router.push('/check-in');
  }
  else if (stepIndex === 5) {
    router.push('/records');
  }
};

const handleGuideFinish = () => {
  router.push('/check-in');
};
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between; 
  padding: calc(16px + env(safe-area-inset-top)) 16px 16px 16px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.user-info {
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.nickname {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  max-width: 100px; 
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-level-tag {
  font-size: 10px !important;
  padding: 2px 6px !important;
  font-weight: normal;
  box-shadow: 0 2px 6px rgba(123, 198, 61, 0.3);
}

.status {
  display: flex;
  align-items: center;
  margin-top: 2px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: #07c160;
  border-radius: 50%;
  margin-right: 4px;
}

.status-text {
  font-size: 12px;
  color: #999;
}

.header-right {
  display: flex;
  align-items: center;
}

.bmi-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f7f8fa;
  padding: 6px 12px;
  border-radius: 12px;
  border: 1px solid #ebedf0;
}

.bmi-header {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
}

.bmi-label {
  font-size: 10px;
  color: #969799;
  font-weight: bold;
}

.bmi-value {
  font-size: 18px;
  font-weight: 900;
  font-family: monospace; 
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 50px; 
}
</style>