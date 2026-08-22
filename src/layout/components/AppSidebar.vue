<template>
    <aside class="sidebar">
        <el-menu :default-active="$route.path" background-color="#001529" text-color="rgba(255,255,255,0.7)"
            active-text-color="#409eff" router>
            <!-- 动态左侧菜单（当前微服务的子菜单） -->
            <sidebar-item v-for="menu in permissionStore.sideMenus" :key="menu.id" :menu="menu" />
        </el-menu>
    </aside>
</template>

<script setup lang="ts">
import { usePermissionStore } from '@/stores/modules/permission'
import SidebarItem from './SidebarItem.vue'

const permissionStore = usePermissionStore()
</script>

<style scoped>
.sidebar {
    width: 200px;
    background: #001529;
    height: 100%;
    overflow-y: auto;
}

.el-menu {
    border-right: none;
}
</style>