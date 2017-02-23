/* eslint no-console: 0 */

const path = require('path');
const express = require('express');
const isDeveloping = process.env.NODE_ENV !== 'production';
const socketio = require('socket.io');
const port = isDeveloping ? 3000 : process.env.PORT;
const app = express();
const errorHandler = require('errorhandler')
const register = require('./lib/register');
const RollDice = require('./lib/roll-dice');

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

if (process.env.NODE_ENV === 'development') {
  app.use(errorhandler())
}

if (isDeveloping) {
  initWebpack();
} else {
  app.use(express.static(__dirname + '/dist'));
  app.get('*', function response(req, res) {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
}
server = app.listen(port, '0.0.0.0', function onStart(err) {
  if (err) {
    console.log(err);
  }
  console.info('==> 🌎 Listening on port %s. Open up http://0.0.0.0:%s/ in your browser.', port, port);
});

const io = socketio.listen(server);

register.set('io', 'io');
register.set('rollDice', new RollDice(io));

io.sockets.on('connection', function(socket) {
  socket.emit('message', { message: 'welcome to the game' });
  socket.on('room', function(room) {
    if (socket.room) {
      io.in(socket.room).emit('user left', room);
      socket.leave(socket.room);
    }

    if (room) {
      socket.room = room;
      socket.join(room);

      io.in(room).emit('user joined', room);
    }
  });

  socket.on('disconnect', function(data) {
    console.log('disconnect');
    // Game.findById(_id, function(err, game) {

    //   if (game) {

    //     // Drop out of the game
    //     socket.leave(_room);

    //     // Again, multiple players _may_ drop at the same time
    //     // so this needs to be atomic.
    //     Game.findOneAndUpdate({ '_id': _id, 'players.id': _player }, { $set: { 'players.$.status': 'left', 'players.$.statusDate': Date.now() } },
    //       function(err, game) {

    //         // Notify the other clients the player left the game
    //         io.sockets.in(_room).emit('left');
    //       }
    //     );

    //   }
    // });
  });
});



// // now, it's easy to send a message to just the clients in a given room
// room = "abc123";
// io.sockets.in(room).emit('message', 'what is going on, party people?');

// this message will NOT go to the client defined above
//io.sockets.in('foobar').emit('message', 'anyone in this room yet?');