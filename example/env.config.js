module.exports = {
  envList: [
    {
      name: "1号测试环境",
      localPort: "3001",
      index: "/main",
      target: "http://localhost:3010",
    },
    {
      name: "2号测试环境",
      target: "http://localhost:3012",
      index: "/main",
      localPort: "3002",
    },
    {
      name: "3号测试环境",
      target: "http://localhost:3013",
      index: "/main",
      localPort: "3003",
    },
  ],
};
