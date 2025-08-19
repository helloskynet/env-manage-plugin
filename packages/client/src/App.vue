<script setup lang="ts">
import { ref } from 'vue'
import MainTable from './components/MainPage.vue'
import TestCom from './components/TestCom.vue'

const isTest = ref(location.href.includes('Test'))
</script>

<template>
  <header>
    <img
      alt="Vue logo"
      class="logo"
      src="./assets/logo.svg"
      width="25"
      height="25"
    />
    开发环境管理系统 -- {{ isTest ? '测试页面' : '管理页面' }}
  </header>
  <br />
  <main>
    <TestCom v-if="isTest" />
    <MainTable v-else />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}
</style>
