require('dotenv').config();

module.exports = {
  name: 'Therapy homepage',
  copyright: 'Ilya Klimov',
  paths: {
    src: {
      base: 'src/',
      css: 'src/css/',
      js: 'src/js/',
    },
    build: {
      base: 'build',
      clean: ['./**/*'],
    },
    public: 'public',
  },
  urls: {
    live: '/',
    local: '/',
    critical: '/',
    publicPath: '/',
  },
  vars: {
    cssName: 'styles',
  },
  entries: {
    app: 'index.tsx',
  },
  copyWebpackConfig: [
    {
      from: './src/js/workbox-catch-handler.js',
      to: '[name].[ext]',
    },
  ],
  criticalCssConfig: {
    base: '/build/criticalcss/',
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
    poll: () => process.env.DEVSERVER_POLL || true,
    port: () => process.env.DEVSERVER_PORT || 3000,
    https: () => process.env.DEVSERVER_HTTPS || false,
  },
  manifestConfig: {
    basePath: '',
  },
  saveRemoteFileConfig: [
    {
      url: 'https://www.google-analytics.com/analytics.js',
      filepath: 'analytics.js',
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
    swDest: 'sw.js',
    precacheManifestFilename: 'precache-manifest.[manifestHash].js',
    importScripts: ['/build/workbox-catch-handler.js'],
    exclude: [/\.(png|jpe?g|gif|svg|webp)$/i, /\.map$/, /^manifest.*\\.js(?:on)?$/],
    globDirectory: 'build',
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
