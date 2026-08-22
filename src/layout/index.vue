<template>
    <div class="app-wrapper">
        <!-- 顶部导航 -->
        <app-header />
        <div class="main-container">
            <!-- 左侧菜单 -->
            <app-sidebar />
            <!-- 右侧内容区 -->
            <app-main />
        </div>
    </div>
</template>

<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import AppMain from './components/AppMain.vue'
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
</style>