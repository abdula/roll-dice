'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: [
    path.join(__dirname, 'client/main.js')
  ],
  output: {
    path: path.join(__dirname, '/dist/'),
    filename: '[name]-[hash].min.js',
    publicPath: '/'
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new HtmlWebpackPlugin({
      template: 'client/index.tpl.html',
      inject: 'body',
      filename: 'index.html'
    }),
    new ExtractTextPlugin('[name]-[hash].min.css'),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
        screw_ie8: true
      }
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ],
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loaders: ['ng-annotate', 'babel?presets[]=es2015&presets[]=stage-0'],
    }, {
      test: /\.json?$/,
      loader: 'json'
    }, {
      test: /\.css$/,
      //loader: 'style-loader!css-loader'
      loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
    }, {
      test: /\.(jade|pug)$/,
      // pass options to pug as a query ('pug-html-loader?pretty')
      loader: 'pug-html-loader'
    }],
  },
  postcss: [
    require('autoprefixer')
  ]
};