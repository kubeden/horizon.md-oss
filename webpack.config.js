const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

// Create two different configurations
module.exports = [
    // Configuration for content script
    {
        name: 'content',
        mode: 'production',
        entry: {
            content: './src/main.js'
        },
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
            clean: false // Don't clean on first config
        },
        module: {
            rules: [{
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }]
        },
        target: 'web'
    },

    // Configuration for service worker (background)
    {
        name: 'background',
        mode: 'production',
        entry: {
            'background-loader': './src/background/background-loader.js'
        },
        output: {
            filename: '[name].bundle.js',
            path: path.resolve(__dirname, 'dist'),
            clean: false // Don't clean as content script config will handle it
        },
        module: {
            rules: [{
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: {
                                    chrome: '80' // Targeting modern Chrome for service worker
                                }
                            }]
                        ]
                    }
                }
            }]
        },
        target: 'webworker', // Specifically target service worker environment
        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: "images", to: "images" },
                    { from: "assets", to: "assets" },
                    { from: "*.html", to: "[name][ext]" }
                ],
            }),
        ],
    }
];