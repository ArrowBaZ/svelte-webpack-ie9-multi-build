const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { resolve } = require('path')
const mode = process.env.NODE_ENV || 'development'
const prod = mode === 'production'
const { sass } = require('svelte-preprocess')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const merge = require('webpack-merge')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const webpack = require('webpack')
const isInline = process.env.inline
const ENV = process.argv.find(arg => arg.includes('production'))
            ? 'production'
            : 'development'
const ANALYZE = process.argv.find(arg => arg.includes('--analyze'))
const OUTPUT_PATH = ENV === 'production' ? resolve('dist') : resolve('src')
const INDEX_TEMPLATE = resolve('./public/index.html')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const WebpackBuildNotifierPlugin = require('webpack-build-notifier')
const PACKAGE = require('./package.json')
const banner = PACKAGE.name + ' - ' + PACKAGE.version + ' | ' + new Date().toString()
const modernTerser = new TerserWebpackPlugin({
    terserOptions: {
        parse: {
            // we want terser to parse ecma 8 code. However, we don't want it
            // to apply any minfication steps that turns valid ecma 5 code
            // into invalid ecma 5 code. This is why the 'compress' and 'output'
            // sections only apply transformations that are ecma 5 safe
            // https://github.com/facebook/create-react-app/pull/4234
            ecma: 8
        },
        compress: {
            ecma: 5,
            warnings: false,
            // Disabled because of an issue with Uglify breaking seemingly valid code:
            // https://github.com/facebook/create-react-app/issues/2376
            // Pending further investigation:
            // https://github.com/mishoo/UglifyJS2/issues/2011
            comparisons: false,
            // Disabled because of an issue with Terser breaking valid code:
            // https://github.com/facebook/create-react-app/issues/5250
            // Pending futher investigation:
            // https://github.com/terser-js/terser/issues/120
            inline: 2
        },
        mangle: {
            safari10: true
        },
        output: {
            ecma: 5,
            comments: false,
            // Turned on because emoji and regex is not minified properly using default
            // https://github.com/facebook/create-react-app/issues/2488
            ascii_only: true
        }
    },
    cache: true,
    parallel: true,
    sourceMap: true // Must be set to true if using source-maps in production
})
const commonConfig = merge([
    {
        entry: './src/main.js',
        output: {
            path: __dirname + '/dist',
            // publicPath: process.env.NODE_ENV === 'production' ? '/shared_res/agility/tracktrace/' : '/public',
            filename: '[name].js',
            chunkFilename: '[name].[id].js'
        },
        plugins: []
    }
])

const developmentConfig = merge([
    {
        devtool: '#cheap-module-eval-source-map', module: {
            rules: [
                {
                    test: /(\.m?js?$)|(\.svelte$)/,
                    exclude: [
                        /\bcore-js\b/,
                        /node_modules\/(?!svelte)|(?!nespresso-.*)/
                    ],
                    use: {
                        loader: 'babel-loader',
                        options: {
                            'babelrc': false,
                            'plugins': [
                                '@babel/plugin-transform-runtime'
                            ],
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        targets: {
                                            'browsers': [
                                                '> 1%',
                                                'last 2 versions',
                                                'Firefox ESR',
                                                'not op_mini all',
                                                'ie >= 10'
                                            ]
                                        },
                                        modules: false,
                                        useBuiltIns: 'entry',
                                        corejs: 3
                                    }
                                ]
                            ],
                            sourceType: 'unambiguous'
                        }
                    }
                },
                {
                    test: /\.svelte$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'svelte-loader',
                        options: {
                            emitCss: true,
                            hotReload: false,
                            preprocess: require('svelte-preprocess')([
                                sass()
                            ])
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: [
                        /**
                         * MiniCssExtractPlugin doesn't support HMR.
                         * For developing, use 'style-loader' instead.
                         * */
                        prod ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        'postcss-loader'
                    ]
                },
                {
                    test: /\.(svg)(\?.*)?$/,
                    loader: 'svg-inline-loader',
                    options: {
                        removeTags: false,
                        removeSVGTagAttrs: false
                    }
                },
                {
                    test: /\.(png|jpe?g|gif)(\?.*)?$/,
                    loader: 'url-loader',
                    query: {
                        limit: 10000,
                        name: 'img/[name].[hash:7].[ext]'
                    }
                },
                {
                    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                    loader: 'url-loader',
                    query: {
                        limit: 10000,
                        // LP: Used to get the font from a common folder
                        publicPath: process.env.NODE_ENV === 'production' ? '/shared_res/agility/commons/' : '',
                        name: 'fonts/[name].[ext]'
                    }
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: '"development"',
                    BASE_URL: 'false'
                }
            }),
            new HtmlWebpackPlugin({
                inlineSource: isInline ? '.(js|css)$' : '',
                template: INDEX_TEMPLATE,
                title: 'Webpack project'
            }),
            new webpack.BannerPlugin(banner),
            new WebpackBuildNotifierPlugin({
                title: 'Webpack Build Finished',
                suppressSuccess: true
            })
        ],
        devServer: {
            noInfo: true,
            open: false,
            historyApiFallback: true,
            inline: true,
            contentBase: resolve('src'),
            hot: true,
            compress: true,
            overlay: { warnings: false, errors: true },
            port: 8080,
            host: '0',
            disableHostCheck: true,
            stats: {
                colors: true,
                chunks: false
            }
        }
    }
])

const analyzeConfig = ANALYZE ? [new BundleAnalyzerPlugin()] : []

const productionConfig = merge([
    {
        devtool: 'nosources-source-map',
        output: {
            jsonpFunction: 'agilityJsonp',
            path: __dirname + '/dist',
            publicPath: '/shared_res/your-custom-path/',
            filename: 'js/[name].js',
            chunkFilename: 'js/[id].[chunkhash].js'
        },
        optimization: {
            minimizer: [
                modernTerser
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: '"production"',
                    BASE_URL: 'true'
                }
            }),
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: INDEX_TEMPLATE
            }),
            // Compress extracted CSS. We are using this plugin so that possible
            // duplicated CSS from different components can be deduped.
            new OptimizeCSSPlugin(),
            new webpack.BannerPlugin(banner),
            new WebpackBuildNotifierPlugin({
                title: 'Webpack Build Finished',
                suppressSuccess: true
            }),
            ...analyzeConfig
        ]
    }
])
const productionLegacyConfig = merge([
    {
        output: {
            jsonpFunction: 'agilityJsonpLegacy',
            path: __dirname + '/dist',
            publicPath: '/shared_res/your-custom-path/',
            filename: 'js/[name].legacy.js',
            chunkFilename: 'js/[id].[chunkhash].legacy.js'
        },
        module: {
            rules: [
                {
                    test: /(\.m?js?$)|(\.svelte$)/,
                    exclude: [
                        /\bcore-js\b/,
                        /node_modules\/(?!(svelte|gaspard)\/).*/
                    ],
                    use: {
                        loader: 'babel-loader',
                        options: {
                            babelrc: false,
                            plugins: [
                                '@babel/plugin-transform-runtime',
                                '@babel/plugin-transform-spread',
                                '@babel/plugin-transform-async-to-generator'
                            ],
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        targets: {
                                            'browsers': [
                                                '> 1%',
                                                'last 2 versions',
                                                'Firefox ESR',
                                                'not op_mini all',
                                                'ie >= 10'
                                            ]
                                        },
                                        modules: false,
                                        useBuiltIns: 'usage',
                                        corejs: { version: 3, proposals: true }
                                    }
                                ]
                            ],
                            sourceType: 'unambiguous'
                        }
                    }
                },
                {
                    test: /\.svelte$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'svelte-loader',
                        options: {
                            emitCss: true,
                            hotReload: false,
                            preprocess: require('svelte-preprocess')([
                                sass()
                            ])
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: [
                        /**
                         * MiniCssExtractPlugin doesn't support HMR.
                         * For developing, use 'style-loader' instead.
                         * */
                        prod ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        'postcss-loader'
                    ]
                },
                {
                    test: /\.(svg)(\?.*)?$/,
                    loader: 'svg-inline-loader',
                    options: {
                        removeTags: false,
                        removeSVGTagAttrs: false
                    }
                },
                {
                    test: /\.(png|jpe?g|gif)(\?.*)?$/,
                    loader: 'url-loader',
                    query: {
                        limit: 10000,
                        name: 'img/[name].[hash:7].[ext]'
                    }
                },
                {
                    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                    loader: 'url-loader',
                    query: {
                        limit: 10000,
                        // LP: Used to get the font from a common folder
                        publicPath: process.env.NODE_ENV === 'production' ? '/shared_res/agility/commons/' : '',
                        name: 'fonts/[name].[ext]'
                    }
                }
            ]
        }
    }
])

module.exports = mode => {
    if (mode === 'production') {
        return [
            merge(commonConfig, productionConfig, {
                mode,
                module: {
                    rules: [
                        {
                            test: /(\.m?js?$)|(\.svelte$)/,
                            include: [
                                resolve('node_modules/nespresso-library'),
                                resolve('node_modules/gaspard')
                            ],
                            exclude: /node_modules\/(?!svelte)/,
                            use: {
                                loader: 'babel-loader',
                                options: {
                                    presets: [
                                        [
                                            '@babel/preset-env',
                                            {
                                                targets: {
                                                    'browsers': [
                                                        'Chrome >= 71',
                                                        'iOS >= 11',
                                                        'Safari >= 11',
                                                        'Firefox >= 60'
                                                    ]
                                                }
                                            }
                                        ]
                                    ]
                                }
                            }
                        },
                        {
                            test: /\.svelte$/,
                            exclude: /node_modules/,
                            use: {
                                loader: 'svelte-loader',
                                options: {
                                    emitCss: true,
                                    hotReload: false,
                                    preprocess: require('svelte-preprocess')([
                                        sass()
                                    ])
                                }
                            }
                        },
                        {
                            test: /\.css$/,
                            use: [
                                /**
                                 * MiniCssExtractPlugin doesn't support HMR.
                                 * For developing, use 'style-loader' instead.
                                 * */
                                prod ? MiniCssExtractPlugin.loader : 'style-loader',
                                'css-loader',
                                'postcss-loader'
                            ]
                        },
                        {
                            test: /\.(svg)(\?.*)?$/,
                            loader: 'svg-inline-loader',
                            options: {
                                removeTags: false,
                                removeSVGTagAttrs: false
                            }
                        },
                        {
                            test: /\.(png|jpe?g|gif)(\?.*)?$/,
                            loader: 'url-loader',
                            query: {
                                limit: 10000,
                                name: 'img/[name].[hash:7].[ext]'
                            }
                        },
                        {
                            test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                            loader: 'url-loader',
                            query: {
                                limit: 10000,
                                // LP: Used to get the font from a common folder
                                publicPath: process.env.NODE_ENV === 'production' ? '/shared_res/agility/commons/' : '',
                                name: 'fonts/[name].[ext]'
                            }
                        }
                    ]
                }
            }),
            merge(commonConfig, productionConfig, productionLegacyConfig, { mode })
        ]
        // return merge(commonConfig, productionConfig, { mode })
        // return merge(commonConfig, productionConfig, productionLegacyConfig, { mode })
    }

    return merge(commonConfig, developmentConfig, { mode })
}
