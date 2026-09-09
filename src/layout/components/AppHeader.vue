<template>
    <header class="header">
        <!-- 左侧：Logo + 微服务导航 -->
        <div class="header-left">

            <!-- 折叠按钮 -->
            <el-icon class="collapse-btn" @click="appStore.toggleSidebar()">
                <fold v-if="!appStore.sidebarCollapsed" />
                <expand v-else />
            </el-icon>
            <span class="logo">AI-agent</span>
            <nav class="top-nav">
                <span v-for="menu in permissionStore.topMenus" :key="menu.id" class="top-nav-item"
                    :class="{ active: menu.id === permissionStore.currentTopMenuId }"
                    @click="handleSwitchService(menu)">
                    {{ menu.name }}
                </span>
            </nav>
        </div>

        <!-- 右侧：用户信息 -->
        <div class="header-right">
            <el-dropdown @command="handleCommand">
                <span class="user-name">
                    {{ userStore.username || 'Admin' }}
                    <el-icon><arrow-down /></el-icon>
                </span>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </header>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import { useRouter } from 'vue-router'
import type { MenuItem } from '@/api/services/auth/modules/permission'
import { useAppStore } from '@/stores/modules/app'
const appStore = useAppStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const router = useRouter()

function handleSwitchService(menu: MenuItem) {
    if (menu.id === permissionStore.currentTopMenuId) return  // 已选中
    permissionStore.switchTopMenu(menu.id)
}

function handleCommand(command: string) {
    if (command === 'logout') {
        userStore.logout()
        router.push('/login')
    }
}
</script>

<style scoped>

.collapse-btn {
  cursor: pointer;
  font-size: 20px;
  color: #fff;
  margin-right: 10px;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    background: #001529;
    color: #fff;
    padding: 0 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 30px;
    flex: 1;
    overflow: hidden;
}

.logo {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
}

.top-nav {
    display: flex;
    align-items: center;
    gap: 5px;
    overflow-x: auto;
    scrollbar-width: none;
    /* Firefox 隐藏滚动条 */
}

.top-nav::-webkit-scrollbar {
    display: none;
    /* Chrome 隐藏滚动条 */
}

.top-nav-item {
    padding: 8px 16px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.75);
    transition: all 0.2s;
    white-space: nowrap;
    user-select: none;
}

.top-nav-item:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
}

.top-nav-item.active {
    color: #fff;
    background: #409eff;
    font-weight: 500;
}

.header-right .user-name {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    color: #fff;
    font-size: 14px;
    white-space: nowrap;
}
</style>