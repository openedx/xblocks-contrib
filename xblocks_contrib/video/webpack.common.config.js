const path = require('path');
const {WebpackManifestPlugin} = require('webpack-manifest-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const webpack = require('webpack');

const config = {
    entry: {
        'video-xblock': path.resolve(process.cwd(), 'static/js/src/10_main.js'),
    },
    output: {
        path: path.resolve(__dirname, 'static/js/dist'),
        filename: '[name].js'
    },
    resolve: {
        alias: { 
            ajax_prefix: path.resolve(__dirname, 'static/js/utils/ajax_prefix.js'),
            video: path.resolve(__dirname, 'static/js/src/'),
            'edx-ui-toolkit/js': 'edx-ui-toolkit/src/js',
            'hls': 'hls.js/dist/hls.js'
        },
        extensions: ['.js'],
    },
    externals: {
        $: 'jQuery',
        backbone: 'Backbone',
        canvas: 'canvas',
        gettext: 'gettext',
        jquery: 'jQuery',
        logger: 'Logger',
    },
    plugins: [
        new CleanWebpackPlugin(),
        new WebpackManifestPlugin({
            seed: {
                base_url: '/static/js/dist',
            },
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            _: 'underscore',
            AjaxPrefix: 'ajax_prefix',
        }),
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: path.resolve(__dirname, 'static/js/src/util/ajax_prefix.js'),
                use: [
                    'babel-loader',
                    {
                        loader: 'exports-loader',
                        options: {
                            'this.AjaxPrefix': true
                        }
                    }
                ]
            },
        ]
    }
};

module.exports = config
