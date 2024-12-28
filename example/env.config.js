const getEnvConfig = () => {
  return {
    // http-proxy-middleware
    // https://github.com/chimurai/http-proxy-middleware/tree/v2.0.4#readme
    fallbackTarget: "http://localhost:8080",
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
};

module.exports = getEnvConfig;
