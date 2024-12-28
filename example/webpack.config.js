const path = require("path");
const EnvManagePlugin = require("../src/index");

module.exports = {
  entry: "./example/index.js",
  mode: "development",
  devServer: {
    proxy: {
      "/two": "http://localhost:3020",
    },
  },
  plugins: [
    new EnvManagePlugin({
      basePath: "/env",
      envConfigPath: path.resolve(__dirname, "./env.config.js"),
    }),
  ],
};
