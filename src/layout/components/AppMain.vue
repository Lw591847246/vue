<template>
    <main class="main-container">
        <app-tabs />
        <div class="main-content">
            <router-view v-slot="{ Component }">
                <keep-alive>
                    <component :is="Component" />
                </keep-alive>
            </router-view>
        </div>
    </main>
</template>

<script setup lang="ts">
import AppTabs from './AppTabs.vue'
</script>

<style scoped>
.main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.main-content {
    flex: 1;
    padding: 20px;
    background: #f0f2f5;
    overflow-y: auto;
}
</style>