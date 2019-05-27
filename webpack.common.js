const path = require('path');
const merge = require('webpack-merge');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

const pkg = require('./package.json');
const settings = require('./webpack.settings.js');

const configureEntries = () => {
  let entries = {};

  for (const [key, value] of Object.entries(settings.entries)) {
    entries[key] = path.resolve(__dirname, settings.paths.src.base + value);
  }

  return entries;
};

const configureBabelLoader = browserList => ({
  test: /\.(t|j)sx?$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: [
        [
          '@babel/env',
          {
            modules: false,
            useBuiltIns: 'entry',
            targets: {
              browsers: browserList,
            },
          },
        ],
        '@babel/react',
        '@babel/typescript',
      ],
      plugins: [
        ['@babel/transform-runtime', { regenerator: true }],
        'react-hot-loader/babel',

        '@babel/syntax-dynamic-import',
        ['@babel/proposal-class-properties', { loose: true }],
      ],
    },
  },
});

const configureFontLoader = () => ({
  test: /\.(ttf|eot|woff2?)$/i,
  use: [
    {
      loader: 'file-loader',
      options: {
        name: 'assets/fonts/[name].[ext]',
      },
    },
  ],
});

const configureManifest = fileName => ({
  fileName: fileName,
  basePath: settings.manifestConfig.basePath,
  map: file => {
    file.name = file.name.replace(/(\.[a-f0-9]{32})(\..*)$/, '$2');
    return file;
  },
});

const configureHtml = () => ({
  template: path.join(__dirname, settings.paths.public, '/index.html'),
  inject: true,
});

const configureHtmlExt = () => ({
  custom: [
    { test: /\w+(?!legacy)/, attribute: 'type', value: 'module' },
    { test: /\w+(legacy)/, attribute: 'nomodule' },
  ],
});

const baseConfig = {
  name: pkg.name,
  entry: configureEntries(),
  output: {
    path: path.resolve(__dirname, settings.paths.build.base),
    publicPath: settings.urls.publicPath,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [configureFontLoader()],
  },
  plugins: [
    new WebpackNotifierPlugin({
      title: 'Webpack',
      excludeWarnings: true,
      alwaysNotify: true,
    }),
    new HtmlWebpackPlugin(configureHtml()),
    new ScriptExtHtmlWebpackPlugin(configureHtmlExt()),
    new ForkTsCheckerWebpackPlugin(),
  ],
};

const legacyConfig = {
  entry: {
    vendor: '@babel/polyfill',
  },
  module: {
    rules: [configureBabelLoader(Object.values(pkg.browserslist.legacyBrowsers))],
  },
  plugins: [
    new CopyWebpackPlugin(settings.copyWebpackConfig),
    new ManifestPlugin(configureManifest('manifest-legacy.json')),
  ],
};

const modernConfig = {
  module: {
    rules: [configureBabelLoader(Object.values(pkg.browserslist.modernBrowsers))],
  },
  plugins: [new ManifestPlugin(configureManifest('manifest.json'))],
};

module.exports = {
  legacyConfig: merge.strategy({
    module: 'prepend',
    plugins: 'prepend',
  })(baseConfig, legacyConfig),
  modernConfig: merge.strategy({
    module: 'prepend',
    plugins: 'prepend',
  })(baseConfig, modernConfig),
};
