<template>
  <button @click="setCookie">set-cookie</button>
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
  testFunc()
})

const setCookie = () => {
  fetch('/login')
      .then((res) => {
        return res.json()
      })
      .then((item) => {
        document.getElementById('console').innerHTML += item.message + '<br>'
      })
      .catch(() => {
        document.getElementById('console').innerHTML += 'error /simple <br>'
      })
}

const testFunc = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host

  // 构建 WebSocket 连接的 URL
  const socketUrl = `${protocol}//${host}/test`

  const socket = new WebSocket(socketUrl)

  // 连接建立时触发
  socket.addEventListener('open', () => {
    console.log('WebSocket 连接已建立')

    // 定义一个函数，用于定时发送消息
    const sendMessagePeriodically = () => {
      if (socket.readyState === WebSocket.OPEN) {
        // 要发送的消息
        const message = '这是定时发送的消息' + host
        // 发送消息
        socket.send(message)
        console.log('消息已发送:', message)
      }
    }

    // 每 10 秒执行一次 sendMessagePeriodically 函数
    const intervalId = setInterval(sendMessagePeriodically, 10000)

    // 当 WebSocket 连接关闭时，清除定时器
    socket.addEventListener('close', () => {
      console.log('WebSocket 连接已关闭')
      clearInterval(intervalId)
    })
  })

  // 接收到消息时触发
  socket.addEventListener('message', (event) => {
    console.log('收到消息:', event.data)
    document.getElementById('console').innerHTML += event.data + '<br>'
  })

  // 连接出错时触发
  socket.addEventListener('error', (event) => {
    console.error('WebSocket 连接出错:', event)
  })
}
</script>
