import express from "express";
import { WebSocketServer } from "ws";

const createServer = (port, second) => {
  const app = express();
  app.use((req, res, next) => {
    console.log(
      "currentServer: " + req.header("host"),
      "收到消息来自：",
      req.header("referer")
    );
    next();
  });

  app.get("/simple", (req, res) => {
    res.send({ message: "this response from -- simple" + port });
  });
  if (second) {
    app.get("/two", (req, res) => {
      res.send({ message: "this response from -- two " + port });
    });
  }

  app.get("/", (req, res) => {
    res.send("Hello World! form" + port);
  });

  const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });

  // 创建 WebSocket 服务器，并将其附加到 Express 创建的 HTTP 服务器上
  const wss = new WebSocketServer({ server });

  // 处理 WebSocket 连接
  wss.on("connection", (ws) => {
    console.log("有新的 WebSocket 客户端连接");

    // 处理接收到的消息
    ws.on("message", (message) => {
      console.log("接收到 WebSocket 消息:", message.toString());

      // 向客户端发送响应消息
      ws.send("服务器已收到你的消息: " + message.toString());
    });

    // 处理客户端断开连接事件
    ws.on("close", () => {
      console.log("WebSocket 客户端已断开连接");
    });
  });
};

createServer(3010);
createServer(3011);
createServer(3012);
createServer(3013);
createServer(3020, true);
