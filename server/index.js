/* eslint no-console: 0 */

const path = require('path');
const express = require('express');
const isDeveloping = process.env.NODE_ENV !== 'production';
const socketio = require('socket.io');
const port = isDeveloping ? 3000 : process.env.PORT;
const app = express();
const errorHandler = require('errorhandler');
const register = require('./lib/register');
const rollDice = require('./lib/roll-dice');

function initWebpack() {
  const webpack = require('webpack');
  const webpackMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const webpackConfig = require('../webpack.config.js');
  const compiler = webpack(webpackConfig);
  const middleware = webpackMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    contentBase: 'src',
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  });

  app.use(middleware);
  app.use(webpackHotMiddleware(compiler));

  app.get('*', function response(req, res) {
    res.write(middleware.fileSystem.readFileSync(path.join(__dirname, '../dist/index.html')));
    res.end();
  });
}
require('./routes')(app);

if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler());
}

if (isDeveloping) {
  initWebpack();
} else {
  app.use(express.static(path.resolve(__dirname, '../dist')));
  app.get('*', function response(req, res) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}


const server = app.listen(port, '0.0.0.0', function onStart(err) {
  if (err) {
    console.log(err);
  }
  console.info('==> 🌎 Listening on port %s. Open up http://0.0.0.0:%s/ in your browser.', port, port);
});

const io = socketio.listen(server);

register.set('io', io);
register.set('rollDice', new rollDice.Games(io));