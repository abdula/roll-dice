'use strict';

var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  devtool: 'eval-source-map',
  entry: [
    'webpack-hot-middleware/client?reload=true',
    path.join(__dirname, 'client/main.js')
  ],
  output: {
    path: path.join(__dirname, '/dist/'),
    filename: '[name].js',
    publicPath: '/'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'client/index.tpl.html',
      inject: 'body',
      filename: 'index.html'
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ],
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loaders: ['ng-annotate', 'babel?presets[]=es2015&presets[]=stage-0'],
      // query: {
      //   "presets": ["es2015", "stage-0"]
      // }
    }, {
      test: /\.json?$/,
      loader: 'json'
    }, {
      test: /\.css$/,
      // loader: 'style!css?modules&localIdentName=[name]---[local]---[hash:base64:5]'
      loader: "style-loader!css-loader"
    }, {
      test: /\.(jade|pug)$/,
      // pass options to pug as a query ('pug-html-loader?pretty')
      loader: 'pug-html-loader'
    }],
  },
  // plugins: [
  //   new ExtractTextPlugin("[name].css")
  // ]
};