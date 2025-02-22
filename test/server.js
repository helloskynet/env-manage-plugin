const express = require("express");

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

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

createServer(3010);
createServer(3011);
createServer(3012);
createServer(3013);
createServer(3020, true);
