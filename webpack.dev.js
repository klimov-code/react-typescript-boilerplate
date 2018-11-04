// webpack.dev.js - developmental builds
const LEGACY_CONFIG = 'legacy';
const MODERN_CONFIG = 'modern';

// node modules
import merge from 'webpack-merge';
import { resolve, join } from 'path';
import sane from 'sane';
import { HotModuleReplacementPlugin } from 'webpack';

// webpack plugins
import Dashboard from 'webpack-dashboard';
import DashboardPlugin from 'webpack-dashboard/plugin';
const dashboard = new Dashboard();

// config files
import common from './webpack.common.js';
import pkg from './package.json';
import { devServerConfig, paths } from './webpack.settings.js';

// Configure the webpack-dev-server
const configureDevServer = buildType => {
  return {
    public: devServerConfig.public(),
    contentBase: resolve(__dirname, paths.templates),
    host: devServerConfig.host(),
    port: devServerConfig.port(),
    https: !!parseInt(devServerConfig.https()),
    quiet: true,
    hot: true,
    hotOnly: true,
    overlay: true,
    stats: 'errors-only',
    watchOptions: {
      poll: !!parseInt(devServerConfig.poll())
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    // Use sane to monitor all of the templates files and sub-directories
    before: (app, server) => {
      const watcher = sane(join(__dirname, paths.templates), {
        glob: ['**/*'],
        poll: !!parseInt(devServerConfig.poll())
      });
      watcher.on('change', function(filePath, root, stat) {
        console.log('  File modified:', filePath);
        server.sockWrite(server.sockets, 'content-changed');
      });
    }
  };
};

// Configure Image loader
const configureImageLoader = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash].[ext]'
          }
        }
      ]
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash].[ext]'
          }
        }
      ]
    };
  }
};

// Configure the Postcss loader
const configurePostcssLoader = buildType => {
  // Don't generate CSS for the legacy config in development
  if (buildType === LEGACY_CONFIG) {
    return {
      test: /\.(pcss|css)$/,
      loader: 'ignore-loader'
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      test: /\.(pcss|css)$/,
      use: [
        {
          loader: 'style-loader'
        },
        {
          loader: 'vue-style-loader'
        },
        {
          loader: 'css-loader',
          options: {
            importLoaders: 2,
            sourceMap: true
          }
        },
        {
          loader: 'resolve-url-loader'
        },
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: true
          }
        }
      ]
    };
  }
};

// Development module exports
export default [
  merge(common.legacyConfig, {
    output: {
      filename: join('./js', '[name]-legacy.[hash].js'),
      publicPath: devServerConfig.public() + '/'
    },
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: configureDevServer(LEGACY_CONFIG),
    module: {
      rules: [
        configurePostcssLoader(LEGACY_CONFIG),
        configureImageLoader(LEGACY_CONFIG)
      ]
    },
    plugins: [new HotModuleReplacementPlugin()]
  }),
  merge(common.modernConfig, {
    output: {
      filename: join('./js', '[name].[hash].js'),
      publicPath: devServerConfig.public() + '/'
    },
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: configureDevServer(MODERN_CONFIG),
    module: {
      rules: [
        configurePostcssLoader(MODERN_CONFIG),
        configureImageLoader(MODERN_CONFIG)
      ]
    },
    plugins: [
      new HotModuleReplacementPlugin(),
      new DashboardPlugin(dashboard.setData)
    ]
  })
];
