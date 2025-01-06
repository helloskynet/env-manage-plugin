const { PostServer } = require("./PostProxyServer");

class EnvManagePlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.afterPlugins.tap("EnvManagePlugin", (compilation) => {
      this.startIndependent();
    });
  }

  /**
   * 获取后置处理服务器，同时也是管理页面的静态资源服务器
   * 独立启动插件
   */
  startIndependent() {
    const postServer = new PostServer(this.options);
    return postServer;
  }
}

module.exports = EnvManagePlugin;
