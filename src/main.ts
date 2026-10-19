import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Vant from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)

app.use(router)
app.use(Vant)
app.mount('#app')

// 输入法优化
document.addEventListener('focusin', (e) => {
  const target = e.target as HTMLElement
  if (!target) return
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    const input = target as HTMLInputElement
    const fieldCell = input.closest('.van-cell')
    const labelText = fieldCell?.querySelector('.van-field__label')?.textContent || ''
    const placeholder = input.placeholder || ''
    const combinedText = labelText + placeholder + input.name
    if (input.type === 'digit' || combinedText.includes('年龄')) {
      input.setAttribute('type', 'tel')
      input.setAttribute('inputmode', 'numeric')
      return
    }
    if (
      input.type === 'number' ||
      combinedText.includes('体重') ||
      combinedText.includes('身高')
    ) {
      input.setAttribute('inputmode', 'decimal')
      return
    }
    if (input.type === 'text' || target.tagName === 'TEXTAREA') {
      input.setAttribute('inputmode', 'text')
      input.setAttribute('lang', 'zh-CN')
    }
  }
})