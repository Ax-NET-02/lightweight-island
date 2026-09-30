// 全局提示框
import { Notify } from 'vant'

export const showNotify = (message: string, type: 'success' | 'danger' | 'warning' | 'primary' = 'primary') => {
  let background = '#1989fa'

  if (type === 'success') {
    background = '#07c160'
  } else if (type === 'danger') {
    background = '#ee0a24'
  } else if (type === 'warning') {
    background = '#ff976a'
  }

  Notify({
    message,
    background,
    duration: 3000, // 显示3秒
    position: 'bottom', // 底部显示
  })
}