

const fs = require('fs');
const path = require('path');

const webpack = require('webpack');

const Log = require('../utils/Log.js');

// const log = require('./log.js');

function init_server_config(env, cfg = { name: 'server' }, log = new Log()) {

  // Watches and source-maps bundle in 'development' environment.
  let target = 'node';
  // Allows use of globals '__dirname' and '__filename' (not intuitive, I know).
  let node = { __dirname: false, __filename: false };

  // let watch = env.NODE_ENV === 'development' && env.WATCH_SERVER;
  let devtool = env.NODE_ENV === 'development' ? 'source-map' : undefined;

  // WebPack takes an array of plugins (run right to left).
  let plugins = [];

  if(env.NODE_ENV === 'development') {
    // When watching, uses cache to only rebuild changed modules.
    plugins.push(new webpack.HotModuleReplacementPlugin());
  } else if(env.NODE_ENV === 'production') {
    // Uglifies and minifies code to reduce bundle size.
    plugins.push(new webpack.optimize.UglifyJsPlugin({ compress: { warnings: true } }));
    // Sets loader settings to minimize mode.
    plugins.push(new webpack.LoaderOptionsPlugin({ minimize: true }));
  }

  // Provide runtime with environment variables.
  // plugins.push(new webpack.DefinePlugin({ 'process.env': `(${JSON.stringify(env)})` }));

  plugins.push(new webpack.ProgressPlugin((percentage, message) => {
    let type = 'webpack';
    log.setStatus(cfg.name || 'server', { type, percentage, message });
  }));

  let module = {

    // Loaders are run in reverse reading order.
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules\/(?!(agile-ui)\/).*/,
        loader: 'babel-loader',
      }, {
        test: /\.svg$/,
        use: [
          {
            loader: 'babel-loader',
          }, {
            loader: 'svg-react-loader',
          },
        ],
      }, {
        test: /\.(jpg|png)$/,
        loader: 'url-loader',
        options: {
          limit: 25000,
        },
      }, {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/font-woff',
        },
      }, {
        test: /\.pem$/,   // cerificate files
        loader: 'raw-loader',
      }, {
        test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader',
      }, {
        test: /\.scss$/,
        use: [
          {
            loader: 'style-loader',
          }, {
            loader: 'css-loader',
          }, {
            loader: 'postcss-loader',
          }, {
            loader: 'sass-loader',
          },
        ],
      }, {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          }, {
            loader: 'css-loader',
          }, {
            loader: 'postcss-loader',
          },
        ],
      },
    ],

  };

  // let resolve = {
  //   alias: {
  //     'react': path.join(__dirname, '../node_modules/react'),
  //     'react-dom': path.join(__dirname, '../node_modules/react-dom'),
  //     'agile-ui': path.join(__dirname, '../../agile-ui')
  //   }
  // };

  let output = {
    filename: '[name].js',
    path: path.join(__dirname, env.SURVEY_EMBED ? env.HOSTING_OUTPUT_PATH : '../dist/client'),
    publicPath: env.SURVEY_EMBED ? env.HOSTING_OUTPUT_PUBLIC_PATH : '/__static/',
  };

  let externals = {};

  // Marks anything in the node_modules as an external (not bundled).
  fs.readdirSync('node_modules')
    // Ignores hidden files.
    .filter(x => ['.bin'].indexOf(x) === -1)
    // Indicates js modules to be loaded with 'commonjs'.
    .map(module => externals[module] = `commonjs ${module}`);


  return Object.assign({
    node,
    target,
    // watch,
    devtool,
    plugins,
    module,
    // resolve,
    externals,
    output,
  }, cfg || {});

}

module.exports = init_server_config;
