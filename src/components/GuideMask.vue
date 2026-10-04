<template>
  <div v-if="visible" class="guide-mask-wrapper">
    
    <!-- 动态计算位置的镂空高亮区域 -->
    <div class="guide-hole" :style="holeStyle"></div>

    <!-- 提示框 -->
    <div class="guide-tooltip" :style="currentStep.tooltipStyle">
      <h3 class="tooltip-title">{{ currentStep.title }}</h3>
      <p class="tooltip-desc">{{ currentStep.desc }}</p>
      
      <div class="tooltip-reason">
        <span class="lizhi-cat">
            <img src="@/assets/lizhi-cat.png" alt="荔枝喵" />
        </span>
        <p>{{ currentStep.reason }}</p>
      </div>

      <div class="tooltip-footer">
        <span class="skip-btn" @click="handleSkip">跳过教程</span>
        <div class="action-buttons">
          <button class="prev-btn" v-if="currentIndex > 0" @click="handlePrev">上一步</button>
          <button class="next-btn" @click="handleNext">
            {{ isLastStep ? '开始打卡' : '下一步' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted} from 'vue';
import { Dialog } from 'vant';

const emit = defineEmits(['step-change', 'finish']);

const visible = ref(false);
const currentIndex = ref(0);
const holeStyle = ref({});

let trackTimer: any = null;

// 教程引导
const steps = [
    {
        title: '欢迎来到食用指南，荔枝喵带你逛一圈喵！',
        desc: '这里是你的个人中心喵~',
        reason: '先建立你的专属档案，荔枝喵才能帮你准确记录体重变化哦！',
        targetSelector: '.guide-step-1',
        borderRadius: '10px',
        offsetY: 0,
        offsetX: 0,
        padding: 0,
        tooltipStyle: { bottom: '80px', left: '0', right: '0', margin: '0 auto' }
    },
    {
        title: '来这里设置个人信息喵~',
        desc: '先告诉荔枝喵你的初始体重和目标吧！',
        reason: '设置好初始体重和目标体重，荔枝喵就能帮你算出减重进度啦！',
        targetSelector: '.guide-step-2',
        borderRadius: '50%',
        offsetY: -2,
        offsetX: -2,
        padding: 10,
        tooltipStyle: { top: '260px', right: '20px' }
    },
    {
        title: '这里可以换头像喵！',
        desc: '换一张自己喜欢的头像吧~',
        reason: '推荐使用 [1:1] 比例的头像，这样会更好看喵！',
        targetSelector: '.guide-step-3',
        borderRadius: '50%',
        offsetY: -2,
        offsetX: -2,
        padding: 10,
        tooltipStyle: { top: '260px', right: '20px' }
    },
    {
        title: '记得保存你的信息喵~',
        desc: '填写完成后，点击这里保存就好啦！',
        reason: '你的个人数据都会保存在本机，不上传服务器，荔枝喵帮你守好隐私喵！',
        targetSelector: '.guide-step-4',
        borderRadius: '22px',
        offsetY: -2,
        offsetX: -2,
        padding: 2,
        tooltipStyle: { bottom: '80px', left: '50%', transform: 'translateX(-50%)' }
    },
    {
        title: '接下来，完成今天的第一次打卡喵！',
        desc: '输入今天的体重，然后点击【完成打卡】~',
        reason: '不要小看这一次打卡喵！完成第一天，就是你改变自己的第一步！荔枝喵会一直陪着你哦~',
        targetSelector: '.guide-step-5',
        borderRadius: '22px',
        offsetY: -2,
        offsetX: -2,
        padding: 2,
        tooltipStyle: { bottom: '150px', left: '50%', transform: 'translateX(-50%)' }
    },
    {
        title: '这里是你的体重记录喵~',
        desc: '查看每一次打卡的体重变化',
        reason: '之前的记录可以随时查看和修改，荔枝喵陪你一起见证每一点进步喵！',
        targetSelector: '.guide-step-6',
        borderRadius: '10px',
        offsetY: 0,
        offsetX: 0,
        padding: 0,
        tooltipStyle: { bottom: '80px', left: '0', right: '0', margin: '0 auto' }
    }
];

const currentStep = computed(() => steps[currentIndex.value]);
const isLastStep = computed(() => currentIndex.value === steps.length - 1);


const updateHolePosition = () => {
  if (trackTimer) clearInterval(trackTimer);

  let elapsed = 0;
  let hasScrolled = false;
  trackTimer = setInterval(() => {
    elapsed += 50;
    const el = document.querySelector(currentStep.value.targetSelector);

    if (el) {
      if (!hasScrolled) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        hasScrolled = true;
      }
      const rect = el.getBoundingClientRect();
      const padding = currentStep.value.padding || 0;
      const offsetX = currentStep.value.offsetX || 0;
      const offsetY = currentStep.value.offsetY || 0;

      holeStyle.value = {
        top: `${rect.top - padding + offsetY}px`,
        left: `${rect.left - padding + offsetX}px`,
        width: `${rect.width + padding * 2}px`,
        height: `${rect.height + padding * 2}px`,
        borderRadius: currentStep.value.borderRadius
      };
    }
    if (elapsed > 600) {
      clearInterval(trackTimer);
    }
  }, 50);
};

onMounted(() => {
  const hasSeenGuide = localStorage.getItem('has_seen_guide');
  if (!hasSeenGuide) {
    visible.value = true;
    updateHolePosition();
  }
});

// 处理点击“上一步”
const handlePrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    emit('step-change', currentIndex.value);
    updateHolePosition();
  }
};

// 处理点击“下一步”
const handleNext = () => {
  if (isLastStep.value) {
    finish();
  } else {
    currentIndex.value++;
    emit('step-change', currentIndex.value);
    updateHolePosition();
  }
};

// 处理点击“跳过”
const handleSkip = () => {
  Dialog.confirm({
    title: '荔枝喵提醒您',
    message: '强烈建议您跟随教程完成首次设置，以免遗漏重要操作，影响后续体重的准确记录 \n\n确定要跳过吗?',
    confirmButtonText: '残忍跳过',
    cancelButtonText: '继续教程',
    confirmButtonColor: '#999999', 
    cancelButtonColor: '#1989fa',  
    zIndex: 10000,  
  } as any) //
    .then(() => {
      finish();
    })
    .catch(() => {

    });
};

const finish = () => {
  visible.value = false;
  localStorage.setItem('has_seen_guide', 'true');
  emit('finish');
};
</script>

<style scoped>
.guide-mask-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  overflow: hidden;
  pointer-events: auto;
}

.guide-hole {
  position: absolute;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65); 
  border: 2px dashed #ffffff;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  pointer-events: none;
}

.guide-tooltip {
  position: absolute;
  width: 290px;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.4s ease;
}

.tooltip-title {
    margin: 0 0 8px 0;
    font-size: 17px;
    font-weight: bold;
    color: #333;
}

.tooltip-desc {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #555;
    line-height: 1.5;
}

.tooltip-reason {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background-color: #f0f7ff;
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.tooltip-reason span {
    font-size: 16px;
    line-height: 1.4;
}

.tooltip-reason p {
    margin: 0;
    font-size: 12px;
    color: #1989fa;
    line-height: 1.5;
    font-weight: 500;
}

.tooltip-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.skip-btn {
    font-size: 13px;
    color: #999;
    cursor: pointer;
    padding: 4px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.prev-btn {
  background-color: #1989fa;
  color: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.next-btn {
  background-color: #1989fa;
  color: #fff;
  border: none;
  padding: 8px 22px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
  cursor: pointer;
}

.lizhi-cat {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 6px;
  vertical-align: middle;
  animation: lizhi-cat-bounce 2s ease-in-out infinite;
}

/* 动态荔枝喵 */
.lizhi-cat img {
  width: 250%;
  height: 250%;
  object-fit: contain;
  display: block;
}

@keyframes lizhi-cat-bounce {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-3px) rotate(-3deg);
  }
}
</style>