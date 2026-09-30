<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Toast } from 'vant'

const router = useRouter()
const route = useRoute()

onMounted(() => {
  if (Capacitor.isNativePlatform()) {
    let lastTime = 0

    CapacitorApp.addListener('backButton', () => {
      const overlays = document.querySelectorAll('.van-overlay')
      let hasOpenOverlay = false

      for (let i = overlays.length - 1; i >= 0; i--) {
        const overlay = overlays[i] as HTMLElement
        if (window.getComputedStyle(overlay).display !== 'none') {
          hasOpenOverlay = true
          overlay.click()
          return 
        }
      }

      if (hasOpenOverlay) return

      const rootPages = ['/', '/check-in', '/records', '/profile']
      
      if (rootPages.includes(route.path)) {
        const timeNow = new Date().getTime()
        if (timeNow - lastTime < 2000) {
          CapacitorApp.exitApp()
        } else {
          Toast({
            message: '再滑一次退出轻盈小岛',
            position: 'bottom',
          })
          lastTime = timeNow
        }
      } else {
        router.back()
      }
    })
  }
})
</script>

<style>
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>