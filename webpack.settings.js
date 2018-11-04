// webpack.settings.js - webpack settings config

// node modules
require('dotenv').config();

// Webpack settings exports
// noinspection WebpackConfigHighlighting
export const name = 'Therapy homepage';

export const copyright = 'Ilya Klimov';

export const paths = {
  src: {
    base: './src/',
    css: './src/css/',
    js: './src/js/'
  },
  dist: {
    base: './web/dist/',
    clean: ['./img', './criticalcss', './css', './js']
  },
  templates: './templates/'
};

export const urls = {
  live: 'https://example.com/',
  local: 'http://example.test/',
  critical: 'http://example.test/',
  publicPath: '/dist/'
};

export const vars = {
  cssName: 'styles'
};

export const entries = {
  app: 'app.js'
};

export const copyWebpackConfig = [
  {
    from: './src/js/workbox-catch-handler.js',
    to: 'js/[name].[ext]'
  }
];

export const criticalCssConfig = {
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
      template: 'index'
    }
  ]
};

export const devServerConfig = {
  public: () => process.env.DEVSERVER_PUBLIC || 'http://localhost:8080',
  host: () => process.env.DEVSERVER_HOST || 'localhost',
  poll: () => process.env.DEVSERVER_POLL || false,
  port: () => process.env.DEVSERVER_PORT || 8080,
  https: () => process.env.DEVSERVER_HTTPS || false
};

export const manifestConfig = {
  basePath: ''
};

export const purgeCssConfig = {
  paths: ['./templates/**/*.{twig,html}', './src/vue/**/*.{vue,html}'],
  whitelist: ['./src/css/components/**/*.{css,pcss}'],
  whitelistPatterns: [],
  extensions: ['html', 'js', 'twig', 'vue']
};

export const saveRemoteFileConfig = [
  {
    url: 'https://www.google-analytics.com/analytics.js',
    filepath: 'js/analytics.js'
  }
];

export const createSymlinkConfig = [
  {
    origin: 'img/favicons/favicon.ico',
    symlink: '../favicon.ico'
  }
];

export const webappConfig = {
  logo: './src/img/favicon-src.png',
  prefix: 'img/favicons/'
};

export const workboxConfig = {
  swDest: '../sw.js',
  precacheManifestFilename: 'js/precache-manifest.[manifestHash].js',
  importScripts: ['/dist/workbox-catch-handler.js'],
  exclude: [
    /\.(png|jpe?g|gif|svg|webp)$/i,
    /\.map$/,
    /^manifest.*\\.js(?:on)?$/
  ],
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
          maxEntries: 20
        }
      }
    }
  ]
};
