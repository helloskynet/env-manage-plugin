<template>
  <div id="console"></div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'

onMounted(() => {
  document.getElementById('console').innerHTML = '环境启动成功！'
  const timer = () => {
    fetch('/simple')
      .then((res) => {
        return res.json()
      })
      .then((item) => {
        document.getElementById('console').innerHTML += item.message + '<br>'
      })
      .catch(() => {
        document.getElementById('console').innerHTML += 'error /simple <br>'
      })
    fetch('/two')
      .then((res) => {
        return res.json()
      })
      .then((item) => {
        document.getElementById('console').innerHTML += item.message + '<br>'
      })
      .catch(() => {
        document.getElementById('console').innerHTML += 'error /two <br>'
      })
  }
  setInterval(timer, 5000)
  timer()
})
</script>
