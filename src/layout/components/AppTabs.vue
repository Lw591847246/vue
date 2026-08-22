<template>
    <div class="tabs-container">
        <el-scrollbar>
            <div class="tabs-list">
                <div v-for="tab in tabsStore.tabs" :key="tab.path" class="tab-item"
                    :class="{ active: isActive(tab.path) }" @click="handleClick(tab)">
                    <span class="tab-title">{{ tab.title }}</span>
                    <el-icon v-if="!tab.affix" class="tab-close" @click.stop="handleRemove(tab.path)">
                        <close />
                    </el-icon>
                </div>
            </div>
        </el-scrollbar>
    </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useTabsStore } from '@/stores/modules/tabs'
import type { TabItem } from '@/stores/modules/tabs'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()

function isActive(path: string) {
    return route.path === path
}

function handleClick(tab: TabItem) {
    router.push(tab.path)
}

function handleRemove(path: string) {
    const index = tabsStore.tabs.findIndex(tab => tab.path === path)
    tabsStore.removeTab(path)

    // 如果关闭的是当前标签，跳转到相邻标签
    if (route.path === path) {
        const nextTab = tabsStore.tabs[index - 1] || tabsStore.tabs[index]
        if (nextTab) {
            router.push(nextTab.path)
        } else {
            // 没有标签了，回到首页
            router.push('/dashboard')
        }
    }
}
</script>

<style scoped>
.tabs-container {
    height: 40px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    align-items: center;
    padding: 0 10px;
}

.tabs-list {
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
}

.tab-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 3px;
    font-size: 13px;
    color: #495060;
    cursor: pointer;
    background: #f5f7fa;
    transition: all 0.2s;
    user-select: none;
}

.tab-item:hover {
    color: #409eff;
    border-color: #409eff;
}

.tab-item.active {
    background: #409eff;
    color: #fff;
    border-color: #409eff;
}

.tab-close {
    cursor: pointer;
    font-size: 14px;
    color: inherit;
}

.tab-close:hover {
    color: #f56c6c;
}
</style>