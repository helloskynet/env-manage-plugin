module.exports = {
  port: 3099,
  basePath: "/dev-manage-api",
  devServerUrl: "http://localhost:5173",
  envList: [
    {
      name: "dev",
      port: 3000,
      target: "http://localhost:3010",
      indexPath: "/Test",
    },
    {
      name: "test",
      port: 3001,
      target: "http://localhost:3011",
      indexPath: "/Test",
    },
    {
      name: "prod",
      port: 3002,
      target: "http://localhost:3012",
      indexPath: "/Test",
    },
    {
      name: "prod3013",
      port: 3003,
      target: "http://localhost:3013",
      indexPath: "/Test",
    },
    {
      name: "prod20",
      port: 3004,
      target: "http://localhost:3020",
      indexPath: "/Test",
    },
  ],
};
