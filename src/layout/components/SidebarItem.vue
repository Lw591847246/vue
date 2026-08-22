<script setup lang="ts">
import type { MenuItem } from '@/api/services/auth/modules/permission'

defineProps<{
    menu: MenuItem
}>()

function isElementPlusIcon(icon: string) {
    // Element Plus 图标通常是 PascalCase 且不含空格
    return icon && !icon.includes(' ')
}
</script>

<template>
    <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.path || `/${menu.code}`">
        <template #title>
            <!-- Element Plus 图标 -->
            <el-icon v-if="isElementPlusIcon(menu.icon || '')">
                <component :is="menu.icon" />
            </el-icon>
            <!-- iconfont 图标 -->
            <i v-else-if="menu.icon" :class="menu.icon"></i>
            <span>{{ menu.name }}</span>
        </template>
        <sidebar-item v-for="child in menu.children" :key="child.id" :menu="child" />
    </el-sub-menu>

    <el-menu-item v-else :index="menu.path || `/${menu.code}`">
        <el-icon v-if="isElementPlusIcon(menu.icon || '')">
            <component :is="menu.icon" />
        </el-icon>
        <i v-else-if="menu.icon" :class="menu.icon"></i>
        <span>{{ menu.name }}</span>
    </el-menu-item>
</template>