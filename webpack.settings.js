// webpack.settings.js - webpack settings config

// node modules
require('dotenv').config();

// Webpack settings exports
// noinspection WebpackConfigHighlighting
module.exports = {
  name: 'Therapy homepage',
  copyright: 'Ilya Klimov',
  paths: {
    src: {
      base: './src/',
      css: './src/css/',
      js: './src/js/',
    },
    dist: {
      base: './web/dist/',
      clean: ['./img', './criticalcss', './css', './js'],
    },
    templates: './templates/',
  },
  urls: {
    live: '',
    local: '',
    critical: '',
    publicPath: '/dist/',
  },
  vars: {
    cssName: 'styles',
  },
  entries: {
    app: 'app.jsx',
  },
  copyWebpackConfig: [
    {
      from: './src/js/workbox-catch-handler.js',
      to: 'js/[name].[ext]',
    },
  ],
  criticalCssConfig: {
    base: './web/dist/criticalcss/',
    suffix: '_critical.min.css',
    criticalHeight: 1200,
    criticalWidth: 1200,
    ampPrefix: 'amp_',
    ampCriticalHeight: 19200,
    ampCriticalWidth: 600,
    pages: [
      {
        url: '',
        template: 'index',
      },
    ],
  },
  devServerConfig: {
    public: () => process.env.DEVSERVER_PUBLIC || 'http://localhost:3000',
    host: () => process.env.DEVSERVER_HOST || 'localhost',
    poll: () => process.env.DEVSERVER_POLL || false,
    port: () => process.env.DEVSERVER_PORT || 3000,
    https: () => process.env.DEVSERVER_HTTPS || false,
  },
  manifestConfig: {
    basePath: '',
  },
  purgeCssConfig: {
    paths: ['./templates/**/*.html', './src/vue/**/*.html'],
    whitelist: ['./src/css/components/**/*.{css,pcss}'],
    whitelistPatterns: [],
    extensions: ['html', 'js', 'jsx', 'tsx'],
  },
  saveRemoteFileConfig: [
    {
      url: 'https://www.google-analytics.com/analytics.js',
      filepath: 'js/analytics.js',
    },
  ],
  createSymlinkConfig: [
    {
      origin: 'img/favicons/favicon.ico',
      symlink: '../favicon.ico',
    },
  ],
  webappConfig: {
    logo: './src/img/favicon-src.png',
    prefix: 'img/favicons/',
  },
  workboxConfig: {
    swDest: '../sw.js',
    precacheManifestFilename: 'js/precache-manifest.[manifestHash].js',
    importScripts: ['/dist/workbox-catch-handler.js'],
    exclude: [/\.(png|jpe?g|gif|svg|webp)$/i, /\.map$/, /^manifest.*\\.js(?:on)?$/],
    globDirectory: './web/',
    globPatterns: ['offline.html', 'offline.svg'],
    offlineGoogleAnalytics: true,
    runtimeCaching: [
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
        handler: 'cacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 20,
          },
        },
      },
    ],
  },
};
