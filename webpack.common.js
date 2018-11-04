// webpack.common.js - common webpack config
const LEGACY_CONFIG = 'legacy';
const MODERN_CONFIG = 'modern';

// node modules
import { resolve as _resolve } from 'path';
import merge from 'webpack-merge';

// webpack plugins
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ManifestPlugin from 'webpack-manifest-plugin';
import WebpackNotifierPlugin from 'webpack-notifier';

// config files
import { name as _name, browserslist } from './package.json';
import {
  entries as _entries,
  paths,
  manifestConfig,
  urls,
  copyWebpackConfig
} from './webpack.settings.js';

// Configure Babel loader
const configureBabelLoader = browserList => {
  return {
    test: /\.js$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
              useBuiltIns: 'entry',
              targets: {
                browsers: browserList
              }
            }
          ]
        ],
        plugins: [
          '@babel/plugin-syntax-dynamic-import',
          [
            '@babel/plugin-transform-runtime',
            {
              regenerator: true
            }
          ]
        ]
      }
    }
  };
};

// Configure Entries
const configureEntries = () => {
  let entries = {};
  for (const [key, value] of Object.entries(_entries)) {
    entries[key] = _resolve(__dirname, paths.src.js + value);
  }

  return entries;
};

// Configure Font loader
const configureFontLoader = () => {
  return {
    test: /\.(ttf|eot|woff2?)$/i,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]'
        }
      }
    ]
  };
};

// Configure Manifest
const configureManifest = fileName => {
  return {
    fileName: fileName,
    basePath: manifestConfig.basePath,
    map: file => {
      file.name = file.name.replace(/(\.[a-f0-9]{32})(\..*)$/, '$2');
      return file;
    }
  };
};

// Configure Vue loader
const configureVueLoader = () => {
  return {
    test: /\.vue$/,
    loader: 'vue-loader'
  };
};

// The base webpack config
const baseConfig = {
  name: _name,
  entry: configureEntries(),
  output: {
    path: _resolve(__dirname, paths.dist.base),
    publicPath: urls.publicPath
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.esm.js'
    }
  },
  module: {
    rules: [configureFontLoader(), configureVueLoader()]
  },
  plugins: [
    new WebpackNotifierPlugin({
      title: 'Webpack',
      excludeWarnings: true,
      alwaysNotify: true
    }),
    new VueLoaderPlugin()
  ]
};

// Legacy webpack config
const legacyConfig = {
  module: {
    rules: [configureBabelLoader(Object.values(browserslist.legacyBrowsers))]
  },
  plugins: [
    new CopyWebpackPlugin(copyWebpackConfig),
    new ManifestPlugin(configureManifest('manifest-legacy.json'))
  ]
};

// Modern webpack config
const modernConfig = {
  module: {
    rules: [configureBabelLoader(Object.values(browserslist.modernBrowsers))]
  },
  plugins: [new ManifestPlugin(configureManifest('manifest.json'))]
};

// Common module exports
// noinspection WebpackConfigHighlighting
export default {
  legacyConfig: merge(legacyConfig, baseConfig),
  modernConfig: merge(modernConfig, baseConfig)
};
