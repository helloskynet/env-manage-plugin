<template>
  <button @click="setCookie">set-cookie</button>
  <div id="console" ref="consoleRef"></div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

// 明确指定类型为 HTMLElement | null（更准确的初始类型）
const consoleRef = ref<HTMLElement | null>(null);

// 封装一个安全更新内容的函数
const updateConsoleContent = (content: string) => {
  if (consoleRef.value) {
    consoleRef.value.innerHTML += content;
  }
};

onMounted(() => {
  // 初始内容设置
  updateConsoleContent('环境启动成功！<br>');
  
  const timer = () => {
    fetch('/simple')
      .then((res) => res.json())
      .then((item) => {
        updateConsoleContent(item.message + '<br>');
      })
      .catch(() => {
        updateConsoleContent('error /simple <br>');
      });

    fetch('/two')
      .then((res) => res.json())
      .then((item) => {
        updateConsoleContent(item.message + '<br>');
      })
      .catch(() => {
        updateConsoleContent('error /two <br>');
      });
  };

  setInterval(timer, 5000);
  timer();
  testFunc();
});

const setCookie = () => {
  fetch('/login')
    .then((res) => res.json())
    .then((item) => {
      updateConsoleContent(item.message + '<br>');
    })
    .catch(() => {
      updateConsoleContent('error /login <br>');
    });
};

const testFunc = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const socketUrl = `${protocol}//${host}/test`;
  const socket = new WebSocket(socketUrl);

  socket.addEventListener('open', () => {
    console.log('WebSocket 连接已建立');

    const sendMessagePeriodically = () => {
      if (socket.readyState === WebSocket.OPEN) {
        const message = '这是定时发送的消息' + host;
        socket.send(message);
        console.log('消息已发送:', message);
      }
    };

    const intervalId = setInterval(sendMessagePeriodically, 10000);

    socket.addEventListener('close', () => {
      console.log('WebSocket 连接已关闭');
      clearInterval(intervalId);
    });
  });

  socket.addEventListener('message', (event) => {
    console.log('收到消息:', event.data);
    updateConsoleContent(event.data + '<br>');
  });

  socket.addEventListener('error', (event) => {
    console.error('WebSocket 连接出错:', event);
  });
};
</script>
