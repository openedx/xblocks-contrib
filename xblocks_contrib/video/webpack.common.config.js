const path = require('path');
const {WebpackManifestPlugin} = require('webpack-manifest-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

const config = {
    entry: {
        'video-xblock': path.resolve(process.cwd(), 'static/js/src/10_main.js'),
    },
    output: {
        path: path.resolve(__dirname, 'public/js'),
        filename: '[name].js',
        clean: true,
        publicPath: '/'
    },
    resolve: {
        alias: {
            'edx-ui-toolkit/js': 'edx-ui-toolkit/src/js',
            'hls': 'hls.js/dist/hls.js'
        }
    },
    plugins: [
        new CleanWebpackPlugin()
    ]
};

module.exports = config
