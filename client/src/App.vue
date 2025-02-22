<script setup>
import MainTable from './components/MainTable.vue'
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="25" height="25" />
    开发环境管理系统
  </header>
  <br />
  <main>
    <MainTable />
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

</style>
