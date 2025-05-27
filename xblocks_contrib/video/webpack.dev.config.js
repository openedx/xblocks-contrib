const {merge} = require('webpack-merge');
const _ = require('underscore');
const commonConfig = require('./webpack.common.config.js');

module.exports = commonConfig;

module.exports = merge(commonConfig, {
    mode: 'development',
    devtool: 'inline-source-map',
});
