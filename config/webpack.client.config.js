

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const chalk = require('chalk');

const webpack = require('webpack');
const ProgressPlugin = require('progress-bar-webpack-plugin');
const BundleStatsPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const HappyPack = require('happypack');

const happyThreadPool = HappyPack.ThreadPool({ size: 4 });

const Log = require('../utils/Log.js');

// TODO: consolidate this and the `build` method in the gulpfile
function init_client_config(env, cfg = { name: 'client' }, log = new Log()) {

  let target = 'web';
  let cache = true;

  // Watches and source-maps bundle in 'development' environment.
  // let watch = (env.NODE_ENV === 'development' || env.DEBUG_CLIENT) && env.WATCH_CLIENT;
  let devtool = 'source-map'; // (env.NODE_ENV === 'development' || env.DEBUG_CLIENT) ? 'source-map' : undefined;
  let plugins = [];

  plugins.push(new HappyPack({
    id: `${cfg.name || 'client'}_code`,
    threadPool: happyThreadPool,
    cache: true,
    tempDir: path.join(__dirname, '../dist/cache'),
    cachePath: path.join(__dirname, '../dist/cache/cache-[id].json'),
    cacheContext: {
      env: env.NODE_ENV,
      args: env.NODE_ARGS,
      surv_embed: env.SURVEY_EMBED,
    },
    loaders: ['babel-loader'],
  }));

  plugins.push(new HappyPack({
    id: `${cfg.name || 'client'}_style`,
    threadPool: happyThreadPool,
    cache: false,
    tempDir: path.join(__dirname, '../dist/cache'),
    // NOTE: happypack cache fails to watch Sass `@import` statements
    // cachePath: path.join(__dirname, '../dist/cache/cache-[id].json'),
    // cacheContext: {
    //   env: env.NODE_ENV,
    //   args: env.NODE_ARGS,
    //   surv_embed: env.SURVEY_EMBED,
    // },
    loaders: [
      {
        loader: 'css-loader',
        options: { sourceMap: true, importLoaders: 1 },
      },
      {
        loader: 'postcss-loader',
        options: { sourceMap: true, config: { path: path.join(__dirname, './postcss.config.js') } },
      },
      {
        loader: 'sass-loader',
        options: { sourceMap: true },
      },
    ],
  }));

  // TODO: parse out sensitive env vars to avoid exposing on client payload

  // Provide runtime with environment variables.
  // plugins.push(new webpack.DefinePlugin({ 'process.env': `(${JSON.stringify(env)})` }));
  plugins.push(new webpack.EnvironmentPlugin(env));

  plugins.push(new CopyWebpackPlugin([
    {
      from: 'src/client/assets/static/',
    },
  ]));

  plugins.push(new webpack.EnvironmentPlugin(JSON.stringify(env)));

  plugins.push(new webpack.ProgressPlugin((percentage, message) => {
    let type = 'webpack';
    log.setStatus(cfg.name || 'server', { type, percentage, message });
  }));

  // Extract styles to different file.
  plugins.push(new ExtractTextPlugin({
    filename: '[name].css',
    allChunks: true,
  }));

  // Creates 'vendor' chunk for improved page load speed.
  plugins.push(new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    minChunks(module) {
      return module.context && /node_modules/.test(module.context);
    },
  }));
  plugins.push(new webpack.optimize.CommonsChunkPlugin({
    name: 'agile-ui',
    // TODO: figure out why agile-ui styles are not extracted
    minChunks(module) {
      return module.context && /agile-ui/.test(module.context);
    },
  }));
  plugins.push(new webpack.optimize.CommonsChunkPlugin({
    name: 'manifest',
    minChunks: Infinity,
  }));

  if(env.NODE_ENV === 'development') {

    // When watching, uses cache to only rebuild changed modules.
    plugins.push(new webpack.HotModuleReplacementPlugin());
    // plugins.push(new webpack.NamedModulesPlugin());

  } else if(env.NODE_ENV === 'production') {

    // Bundle size stats and visual heat-map.
    plugins.push(new BundleStatsPlugin({
      analyzerMode: 'static',
      reportFilename: '../../bundle-report-client.html',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle_stats.json',
      statsOptions: null,
      logLevel: 'info',
    }));

    // Sets loader settings to minimize mode.
    plugins.push(new webpack.LoaderOptionsPlugin({ minimize: true }));

    // TODO: create service to log all used classnames while testing app to txt file
    // Attempts to remove unused selectors. NOT WORKING
    // plugins.push(new PurifyCSSPlugin({
    //   paths: [
    //     ...glob.sync(path.join(__dirname, '../src/client/**/*.{js, jsx}')),
    //     ...glob.sync(path.join(__dirname, '../../agile-ui/src/**/*.{js, jsx}'))
    //   ],
    //   styleExtensions: ['.css', '.scss'],
    //   minimize: true
    // }));

    // Uglifies and minifies code to reduce bundle size.
    plugins.push(new webpack.optimize.UglifyJsPlugin({
      sourceMap: true, //! !env.DEBUG_CLIENT,
      mangle: true, // +env.DEBUG_CLIENT < 2,
      compress: {
        warnings: true, // +env.DEBUG_CLIENT >= 1,
        drop_console: true, // +env.DEBUG_CLIENT < 2,
      },
    }));

    // Compresses files using 'gzip' algorithm.
    plugins.push(new CompressionPlugin());

  }

  let module = {

    // Loaders are run in reverse reading order.
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules\/(?!(agile-ui)\/).*/,
        loader: `happypack/loader?id=${cfg.name || 'client'}_code`,
        // loader: 'babel-loader'
      },
      {
        test: /\.worker\.jsx?$/,
        loader: 'worker-loader',
        options: { inline: true },
      },
      {
        test: /\.s?css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          loader: `happypack/loader?id=${cfg.name || 'client'}_style`,
        }),
      },

      // TODO: remove this loader in favor of url loader
      {
        test: /\.svg$/,
        use: [
          { loader: 'babel-loader' },
          { loader: 'react-svg-loader' },
        ],
      },
      {
        test: /\.(jpg|png|gif|pdf)$/,
        loader: 'url-loader',
        options: { limit: 25000 },
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/font-woff',
        },
      },
      {
        test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader',
      },
    ],

  };

  let resolve = {
    modules: [path.join(__dirname, '../node_modules'), 'node_modules'],
    alias: {},
  };

  if(!env.JENKINS_BUILD)
    resolve.alias['agile-ui'] = path.join(__dirname, '../../agile-ui');


  // TODO: add entry points (for polyfils & modules)
  // let entry;
  // if(env.NODE_ENV !== 'production') {
  //   entry = [
  //     'react-hot-loader/patch',
  //     // activate HMR for React
  //
  //     'webpack-dev-server/client?http://localhost:8080',
  //     // bundle the client for webpack-dev-server
  //     // and connect to the provided endpoint
  //
  //     'webpack/hot/only-dev-server',
  //     // bundle the client for hot reloading
  //     // only- means to only hot reload for successful updates
  //   ];
  // } else {
  //   entry = [];
  // }
  let webAppGitId = 'no-commit-id';
  try{
    let webAppBuildInfo = require('../build-info.json');
    if(webAppBuildInfo && webAppBuildInfo['git-commit-id-abbrev'])
      webAppGitId = webAppBuildInfo['git-commit-id-abbrev'];

  } catch(error) {}

  // Sets static file URL root (prevents server routing collisions
  let output = {
    filename: `[name].${webAppGitId}.js`,
    path: path.join(__dirname, env.SURVEY_EMBED ? env.HOSTING_OUTPUT_PATH : '../dist/client'),
    publicPath: env.SURVEY_EMBED ? env.HOSTING_OUTPUT_PUBLIC_PATH : '/__static/',
  };

  return Object.assign({
    target,
    cache,
    // watch,
    devtool,
    plugins,
    module,
    resolve,
    output,
  }, cfg || {});

}

module.exports = init_client_config;
