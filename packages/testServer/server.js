import express from "express";
import { WebSocketServer } from "ws";

// 存储所有创建的服务器实例（Express + WebSocket），用于统一关闭
const serverInstances = [];

const createServer = (port, second) => {
  const app = express();
  app.use((req, res, next) => {
    console.log(
      "currentServer: " + req.header("host"),
      "收到消息来自：",
      req.header("referer") || "无"
    );
    next();
  });

  app.get("/simple", (req, res) => {
    res.send({
      message: `this response from -- simple, port:${port},cookie:${req.headers.cookie || "无"}`,
    });
  });
  app.get("/login", (req, res) => {
    res.cookie("sessionID", "12345" + port + new Date().getTime(), {
      maxAge: 900000,
      httpOnly: true,
      secure: false,
      domain: "localhost",
      path: "/",
    });
    res.send({ message: "this response from -- login" + port });
  });
  if (second) {
    app.get("/two", (req, res) => {
      res.send({ message: "this response from -- two " + port });
    });
  }

  app.get("/", (req, res) => {
    res.send("Hello World! form" + port);
  });

  // 创建 Express 服务器
  const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });

  // 创建 WebSocket 服务器
  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    console.log(`[${port}] 有新的 WebSocket 客户端连接`);
    ws.on("message", (message) => {
      console.log(`[${port}] 接收到 WebSocket 消息:`, message.toString());
      ws.send("服务器已收到你的消息: " + message.toString());
    });
    ws.on("close", () => {
      console.log(`[${port}] WebSocket 客户端已断开连接`);
    });
  });

  // 存储服务器和 WebSocket 实例，用于后续关闭
  serverInstances.push({
    port,
    server,
    wss,
  });
};

// 创建多个服务器
createServer(3010);
createServer(3011);
createServer(3012);
createServer(3013);
createServer(3020, true);

// 监听 Ctrl+C 信号（SIGINT），执行优雅退出
process.on("SIGINT", async () => {
  console.log("\n开始关闭所有服务器，释放端口...");

  // 遍历关闭所有服务器实例
  for (const instance of serverInstances) {
    const { port, server, wss } = instance;
    try {
      // 1. 关闭 WebSocket 服务器（先断开客户端连接）
      wss.close(() => {
        console.log(`[${port}] WebSocket 服务已关闭`);
      });

      // 2. 关闭 Express HTTP 服务器，释放端口
      server.close((err) => {
        if (err) {
          console.error(`[${port}] 服务器关闭失败:`, err.message);
        } else {
          console.log(`[${port}] Express 服务器已关闭，端口已释放`);
        }
      });
    } catch (err) {
      console.error(`[${port}] 关闭失败:`, err.message);
    }
  }

  // 所有服务器关闭后，退出进程
  setTimeout(() => {
    console.log("所有服务器已关闭，进程退出");
    process.exit(0);
  }, 1000); // 延迟1秒，确保关闭操作完成
});

// 监听进程退出事件（可选，用于日志）
process.on("exit", (code) => {
  console.log(`进程已退出，退出码: ${code}`);
});