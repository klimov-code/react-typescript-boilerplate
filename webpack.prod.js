const LEGACY_CONFIG = 'legacy';
const MODERN_CONFIG = 'modern';

const git = require('git-rev-sync');
const merge = require('webpack-merge');
const moment = require('moment');
const path = require('path');
const webpack = require('webpack');

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CreateSymlinkPlugin = require('create-symlink-webpack-plugin');
const HtmlCriticalWebpackPlugin = require('html-critical-webpack-plugin');
const ImageminWebpWebpackPlugin = require('imagemin-webp-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const SaveRemoteFilePlugin = require('save-remote-file-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WebappWebpackPlugin = require('webapp-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

const common = require('./webpack.common.js');
const pkg = require('./package.json');
const settings = require('./webpack.settings.js');

const configureBanner = () => ({
  banner: [
    '/*!',
    ' * @project        ' + settings.name,
    ' * @name           ' + '[filebase]',
    ' * @author         ' + pkg.author.name,
    ' * @build          ' + moment().format('llll') + ' ET',
    ' * @release        ' + git.long() + ' [' + git.branch() + ']',
    ' * @copyright      Copyright (c) ' + moment().format('YYYY') + ' ' + settings.copyright,
    ' *',
    ' */',
    '',
  ].join('\n'),
  raw: true,
});

const configureBundleAnalyzer = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      analyzerMode: 'static',
      reportFilename: 'report-legacy.html',
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      analyzerMode: 'static',
      reportFilename: 'report-modern.html',
    };
  }
};

const configureHtmlCritical = () =>
  settings.criticalCssConfig.pages.map(row => {
    const criticalSrc = settings.urls.critical + row.url;
    const criticalDest =
      settings.criticalCssConfig.base + row.template + settings.criticalCssConfig.suffix;
    let criticalWidth = settings.criticalCssConfig.criticalWidth;
    let criticalHeight = settings.criticalCssConfig.criticalHeight;
    // Handle Google AMP templates
    if (row.template.indexOf(settings.criticalCssConfig.ampPrefix) !== -1) {
      criticalWidth = settings.criticalCssConfig.ampCriticalWidth;
      criticalHeight = settings.criticalCssConfig.ampCriticalHeight;
    }
    console.log('source: ' + criticalSrc + ' dest: ' + criticalDest);
    return new HtmlCriticalWebpackPlugin({
      base: './',
      src: criticalSrc,
      dest: criticalDest,
      extract: false,
      inline: false,
      minify: true,
      width: criticalWidth,
      height: criticalHeight,
    });
  });

const configureCleanWebpack = () => ({
  root: path.resolve(__dirname, settings.paths.build.base),
  verbose: true,
  dry: false,
});

const configureImageLoader = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash].[ext]',
          },
        },
      ],
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash].[ext]',
          },
        },
        {
          loader: 'img-loader',
          options: {
            plugins: [
              require('imagemin-gifsicle')({
                interlaced: true,
              }),
              require('imagemin-mozjpeg')({
                progressive: true,
                arithmetic: false,
              }),
              require('imagemin-optipng')({
                optimizationLevel: 5,
              }),
              require('imagemin-svgo')({
                plugins: [{ convertPathData: false }],
              }),
            ],
          },
        },
      ],
    };
  }
};

const configureOptimization = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      splitChunks: {
        cacheGroups: {
          default: false,
          common: false,
          styles: {
            name: settings.vars.cssName,
            test: /\.(p?css)$/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
      minimizer: [
        new TerserPlugin(configureTerser()),
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            map: {
              inline: false,
              annotation: true,
            },
            safe: true,
            discardComments: true,
          },
        }),
      ],
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      minimizer: [new TerserPlugin(configureTerser())],
      concatenateModules: true,
    };
  }
};

const configurePostcssLoader = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      test: /\.(p?css)$/,
      use: [
        MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            importLoaders: 2,
            sourceMap: true,
          },
        },
        {
          loader: 'resolve-url-loader',
        },
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: true,
          },
        },
      ],
    };
  }
  // Don't generate CSS for the modern config in production
  if (buildType === MODERN_CONFIG) {
    return {
      test: /\.(p?css)$/,
      loader: 'ignore-loader',
    };
  }
};

const configureTerser = () => ({
  cache: true,
  parallel: true,
  sourceMap: true,
});

const configureWebapp = () => ({
  logo: settings.webappConfig.logo,
  prefix: settings.webappConfig.prefix,
  cache: false,
  inject: 'force',
  favicons: {
    appName: pkg.name,
    appDescription: pkg.description,
    developerName: pkg.author.name,
    developerURL: pkg.author.url,
    path: settings.paths.build.base,
  },
});

const configureWorkbox = () => {
  const config = settings.workboxConfig;

  return config;
};

module.exports = [
  merge(common.legacyConfig, {
    output: {
      filename: '[name]-legacy.[hash:10].js',
    },
    mode: 'production',
    devtool: 'source-map',
    optimization: configureOptimization(LEGACY_CONFIG),
    module: {
      rules: [configurePostcssLoader(LEGACY_CONFIG), configureImageLoader(LEGACY_CONFIG)],
    },
    plugins: [
      new CleanWebpackPlugin(settings.paths.build.clean, configureCleanWebpack()),
      new MiniCssExtractPlugin({
        path: path.resolve(__dirname, settings.paths.build.base),
        filename: path.join('./css', '[name].[chunkhash].css'),
      }),
      new webpack.BannerPlugin(configureBanner()),
      new WebappWebpackPlugin(configureWebapp()),
      new CreateSymlinkPlugin(settings.createSymlinkConfig, true),
      new SaveRemoteFilePlugin(settings.saveRemoteFileConfig),
      new BundleAnalyzerPlugin(configureBundleAnalyzer(LEGACY_CONFIG)),
    ] /* .concat(configureHtmlCritical()), */,
  }),
  merge(common.modernConfig, {
    output: {
      filename: '[name].[hash:10].js',
    },
    mode: 'production',
    devtool: 'source-map',
    optimization: configureOptimization(MODERN_CONFIG),
    module: {
      rules: [configurePostcssLoader(MODERN_CONFIG), configureImageLoader(MODERN_CONFIG)],
    },
    plugins: [
      new webpack.BannerPlugin(configureBanner()),
      new ImageminWebpWebpackPlugin(),
      new WorkboxPlugin.GenerateSW(configureWorkbox()),
      new BundleAnalyzerPlugin(configureBundleAnalyzer(MODERN_CONFIG)),
    ],
  }),
];
