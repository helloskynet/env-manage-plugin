/** @type {import('env-manage-plugin').EnvmConfig} */
export default {
  indexPage: "/",
  devServerList: [
    {
      name: "vite", // 开发服务器名称
      target: "http://localhost:5173", // 服务器地址
    },
    {
      name: "webpack", // 开发服务器名称
      target: "http://localhost:8080", // 服务器地址
    },
  ],
  envList: [
    {
      name: "dev1", // 环境名称
      port: 3000, // 端口号
      target: "http://localhost:3010", // 代理目标
      devServerName: "vite",
      indexPage: "/", // 首页
      router: (req, env) => {
        return env.target;
      },
    },
  ],
};
