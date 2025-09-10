// webpack.config.js
const path = require("path");

module.exports = {
  entry: {
    problem: [path.resolve(__dirname, "js/src/edx-global-loader.js"), path.resolve(__dirname, "js/src/xmodule.js")],
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "public/js"),
  },
  mode: "development",
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".js"],
    // This corrected alias will now correctly resolve the module.
    alias: {
      "edx-ui-toolkit/js/utils/string-utils": path.join(
        path.dirname(require.resolve("edx-ui-toolkit/package.json")),
        "src/js/utils/string-utils.js",
      ),
    },
  },
};
