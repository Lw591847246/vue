<template>
  <div
    class="app-wrapper"
    :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed, mobile: appStore.isMobile }"
  >
    <app-header />
    <div class="main-container">
      <!-- 移动端侧边栏使用抽屉，桌面端正常显示 -->
      <el-drawer
        v-if="appStore.isMobile"
        :model-value="!appStore.sidebarCollapsed"
        @update:model-value="appStore.toggleSidebar()"
        direction="ltr"
        size="200px"
        :with-header="false"
        class="mobile-sidebar"
      >
        <app-sidebar />
      </el-drawer>

      <!-- 桌面端侧边栏 -->
      <app-sidebar v-else class="sidebar-desktop" />

      <app-main />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import AppMain from './components/AppMain.vue'
import { useAppStore } from '@/stores/modules/app'

const appStore = useAppStore()
</script>

<style scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 桌面端侧边栏宽度 */
.sidebar-desktop {
  width: 200px;
  transition: width 0.3s;
}

/* 折叠时桌面端侧边栏隐藏 */
.sidebar-collapsed .sidebar-desktop {
  width: 0;
  overflow: hidden;
}

/* 移动端抽屉样式 */
.mobile-sidebar {
  :deep(.el-drawer__body) {
    padding: 0;
  }
}
</style>
