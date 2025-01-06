/**
 * An array of environment configurations.
 * @typedef {Object} EnvironmentConfig
 * @property {string} name - 环境名称
 * @property {string} index - 首页
 * @property {DevServerConfig} devServer - 前置开发服务器配置
 *
 * @typedef {Object} DevServerConfig
 * @property {string} port - 前置开发服务器端口
 * @property {string} target - 请求转发地址
 * @property {function(middlewares)} setupMiddlewares - 自定义中间件
 * @property {import("http-proxy-middleware").Options []} proxy 代理配置
 */

module.exports = {
  basePath:'/env',
  port: '3000',
  devServerUrl:'http://localhost:8080',
  /**
   * An array of environment configurations.
   * @type {EnvironmentConfig[]}
   */
  envList: [
    {
      name: "1号测试环境",
      key:'11',
      index: "/main",
      devServer: {
        port: "3001",
        target: "http://localhost:3010",
        setupMiddlewares: (middlewares) => {
          console.log("1号测试环境中间件", middlewares);
          return middlewares;
        },
        proxy: [
          {
            target:'http://localhost:3020',
            pathFilter:['/simple']
          },
        ],
      },
    },
    {
      name: "2号测试环境",
      index: "/main",
      key:'21',
      devServer: {
        port: "3002",
        target: "http://localhost:3012",
        setupMiddlewares: (middlewares) => {
          console.log("2号测试环境中间件", middlewares);
          return middlewares;
        },
      },
    },
    {
      name: "3号测试环境",
      index: "/main",
      key:'62',
      devServer: {
        port: "3003",
        target: "http://localhost:3013",
        setupMiddlewares: (middlewares) => {
          console.log("3号测试环境中间件", middlewares);
          return middlewares;
        },
      },
    },
  ],
};
