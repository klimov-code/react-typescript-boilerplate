// webpack.prod.js - production builds
const LEGACY_CONFIG = 'legacy';
const MODERN_CONFIG = 'modern';

// node modules
import { long, branch } from 'git-rev-sync';
import { sync } from 'glob-all';
import merge from 'webpack-merge';
import moment from 'moment';
import { resolve, join } from 'path';
import { BannerPlugin, optimize } from 'webpack';

// webpack plugins
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import CreateSymlinkPlugin from 'create-symlink-webpack-plugin';
import CriticalCssPlugin from 'critical-css-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ImageminWebpWebpackPlugin from 'imagemin-webp-webpack-plugin';
import MiniCssExtractPlugin, {
  loader as _loader
} from 'mini-css-extract-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import PurgecssPlugin from 'purgecss-webpack-plugin';
import SaveRemoteFilePlugin from 'save-remote-file-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import WebappWebpackPlugin from 'webapp-webpack-plugin';
import WhitelisterPlugin from 'purgecss-whitelister';
import { GenerateSW } from 'workbox-webpack-plugin';

// config files
import common from './webpack.common.js';
import { author, name as _name, description } from './package.json';
import {
  name as __name,
  copyright,
  criticalCssConfig,
  urls,
  paths as _paths,
  vars,
  purgeCssConfig,
  webappConfig,
  workboxConfig,
  createSymlinkConfig,
  saveRemoteFileConfig
} from './webpack.settings.js';

// Custom PurgeCSS extractor for Tailwind that allows special characters in
// class names.
//
// https://github.com/FullHuman/purgecss#extractor
class TailwindExtractor {
  static extract(content) {
    return content.match(/[A-Za-z0-9-_:\/]+/g) || [];
  }
}

// Configure file banner
const configureBanner = () => {
  return {
    banner: [
      '/*!',
      ' * @project        ' + __name,
      ' * @name           ' + '[filebase]',
      ' * @author         ' + author.name,
      ' * @build          ' + moment().format('llll') + ' ET',
      ' * @release        ' + long() + ' [' + branch() + ']',
      ' * @copyright      Copyright (c) ' +
        moment().format('YYYY') +
        ' ' +
        copyright,
      ' *',
      ' */',
      ''
    ].join('\n'),
    raw: true
  };
};

// Configure Bundle Analyzer
const configureBundleAnalyzer = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      analyzerMode: 'static',
      reportFilename: 'report-legacy.html'
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      analyzerMode: 'static',
      reportFilename: 'report-modern.html'
    };
  }
};

// Configure Critical CSS
const configureCriticalCss = () => {
  return criticalCssConfig.pages.map(row => {
    const criticalSrc = urls.critical + row.url;
    const criticalDest =
      criticalCssConfig.base + row.template + criticalCssConfig.suffix;
    let criticalWidth = criticalCssConfig.criticalWidth;
    let criticalHeight = criticalCssConfig.criticalHeight;
    // Handle Google AMP templates
    if (row.template.indexOf(criticalCssConfig.ampPrefix) !== -1) {
      criticalWidth = criticalCssConfig.ampCriticalWidth;
      criticalHeight = criticalCssConfig.ampCriticalHeight;
    }
    console.log('source: ' + criticalSrc + ' dest: ' + criticalDest);
    return new CriticalCssPlugin({
      base: './',
      src: criticalSrc,
      dest: criticalDest,
      extract: false,
      inline: false,
      minify: true,
      width: criticalWidth,
      height: criticalHeight
    });
  });
};

// Configure Clean webpack
const configureCleanWebpack = () => {
  return {
    root: resolve(__dirname, _paths.dist.base),
    verbose: true,
    dry: false
  };
};

// Configure Html webpack
const configureHtml = () => {
  return {
    templateContent: '',
    filename: 'webapp.html',
    inject: false
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
        },
        {
          loader: 'img-loader',
          options: {
            plugins: [
              require('imagemin-gifsicle')({
                interlaced: true
              }),
              require('imagemin-mozjpeg')({
                progressive: true,
                arithmetic: false
              }),
              require('imagemin-optipng')({
                optimizationLevel: 5
              }),
              require('imagemin-svgo')({
                plugins: [{ convertPathData: false }]
              })
            ]
          }
        }
      ]
    };
  }
};

// Configure optimization
const configureOptimization = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      splitChunks: {
        cacheGroups: {
          default: false,
          common: false,
          styles: {
            name: vars.cssName,
            test: /\.(pcss|css|vue)$/,
            chunks: 'all',
            enforce: true
          }
        }
      },
      minimizer: [
        new TerserPlugin(configureTerser()),
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            map: {
              inline: false,
              annotation: true
            },
            safe: true,
            discardComments: true
          }
        })
      ]
    };
  }
  if (buildType === MODERN_CONFIG) {
    return {
      minimizer: [new TerserPlugin(configureTerser())]
    };
  }
};

// Configure Postcss loader
const configurePostcssLoader = buildType => {
  if (buildType === LEGACY_CONFIG) {
    return {
      test: /\.(pcss|css)$/,
      use: [
        _loader,
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
  // Don't generate CSS for the modern config in production
  if (buildType === MODERN_CONFIG) {
    return {
      test: /\.(pcss|css)$/,
      loader: 'ignore-loader'
    };
  }
};

// Configure PurgeCSS
const configurePurgeCss = () => {
  let paths = [];
  // Configure whitelist paths
  for (const [key, value] of Object.entries(purgeCssConfig.paths)) {
    paths.push(join(__dirname, value));
  }

  return {
    paths: sync(paths),
    whitelist: WhitelisterPlugin(purgeCssConfig.whitelist),
    whitelistPatterns: purgeCssConfig.whitelistPatterns,
    extractors: [
      {
        extractor: TailwindExtractor,
        extensions: purgeCssConfig.extensions
      }
    ]
  };
};

// Configure terser
const configureTerser = () => {
  return {
    cache: true,
    parallel: true,
    sourceMap: true
  };
};

// Configure Webapp webpack
const configureWebapp = () => {
  return {
    logo: webappConfig.logo,
    prefix: webappConfig.prefix,
    cache: false,
    inject: 'force',
    favicons: {
      appName: _name,
      appDescription: description,
      developerName: author.name,
      developerURL: author.url,
      path: _paths.dist.base
    }
  };
};

// Configure Workbox service worker
const configureWorkbox = () => {
  let config = workboxConfig;

  return config;
};

// Production module exports
export default [
  merge(common.legacyConfig, {
    output: {
      filename: join('./js', '[name]-legacy.[chunkhash].js')
    },
    mode: 'production',
    devtool: 'source-map',
    optimization: configureOptimization(LEGACY_CONFIG),
    module: {
      rules: [
        configurePostcssLoader(LEGACY_CONFIG),
        configureImageLoader(LEGACY_CONFIG)
      ]
    },
    plugins: [
      new CleanWebpackPlugin(_paths.dist.clean, configureCleanWebpack()),
      new MiniCssExtractPlugin({
        path: resolve(__dirname, _paths.dist.base),
        filename: join('./css', '[name].[chunkhash].css')
      }),
      new PurgecssPlugin(configurePurgeCss()),
      new BannerPlugin(configureBanner()),
      new HtmlWebpackPlugin(configureHtml()),
      new WebappWebpackPlugin(configureWebapp()),
      new CreateSymlinkPlugin(createSymlinkConfig, true),
      new SaveRemoteFilePlugin(saveRemoteFileConfig),
      new BundleAnalyzerPlugin(configureBundleAnalyzer(LEGACY_CONFIG))
    ].concat(configureCriticalCss())
  }),
  merge(common.modernConfig, {
    output: {
      filename: join('./js', '[name].[chunkhash].js')
    },
    mode: 'production',
    devtool: 'source-map',
    optimization: configureOptimization(MODERN_CONFIG),
    module: {
      rules: [
        configurePostcssLoader(MODERN_CONFIG),
        configureImageLoader(MODERN_CONFIG)
      ]
    },
    plugins: [
      new optimize.ModuleConcatenationPlugin(),
      new BannerPlugin(configureBanner()),
      new ImageminWebpWebpackPlugin(),
      new GenerateSW(configureWorkbox()),
      new BundleAnalyzerPlugin(configureBundleAnalyzer(MODERN_CONFIG))
    ]
  })
];
