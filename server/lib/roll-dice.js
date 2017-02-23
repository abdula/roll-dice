const uuid = require('uuid');
const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('game');
const Moniker = require('moniker');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//https://github.com/michaeldegroot/roomdata/blob/master/roomdata.js

class Games {
  constructor(io) {
    this.io = io;
    this.games = {};
    this._listenIO(io);
  }

  _listenIO(io) {
    const onConnect = this.onConnect.bind(this);
    io.sockets.on('connection', onConnect);
  }

  sendGameInfo(room) {
    if (this.has(room)) {
      this.io.in(room).emit('game.info', this.get(room).getInfo());
    }
  }

  onConnect(socket) {
    socket.playerName = Moniker.choose();

    let onRoom = (room) => {
      if (socket.room) {
        this.io.in(socket.room).emit('players.left', { name: socket.playerName });
        socket.leave(socket.room);
      }

      if (room) {
        socket.room = room;
        socket.join(room);

        this.io.in(room).emit('players.joined', room);
      }
      this.sendGameInfo();
    }

    socket.on('play', function(socket) {});
    socket.on('room', onRoom);
    socket.on('disconnect', this.onDisconnect);
  }

  onDisconnect(socket) {
    debug('disconnect');
  }

  generateRoom() {
    return uuid.v4();
  }

  has(room) {
    return this.games.hasOwnProperty(room);
  }

  get(room) {
    if (!games[room]) {
      games[room] = this._create(room);
    }
    return games[room];
  }

  _create(room) {
    const game = new Game(room, io);

    game.on('disconnect', function() {
      if (!game.getNumPlayers()) {
        this._destroyGame(game.room);
      }
    });
  }

  _destroyGame(room) {
    delete games[room];
  }
}

class Game extends EventEmitter {
  constructor(room) {
    this.players = [];
    this.status = 'wait';
    this.results = [];
  }

  addPlayer(socket) {
    this.players.push(socket);
  }

  removePlayer(socket) {
    this.players.slice(this.players.indexOf(socket), 1);
  }

  getPlayers() {
    return this.players;
  }

  setStatus(status) {
    this.status = status;
  }

  reset() {
    this.results = [];
  }

  start() {

  }

  getNumPlayers() {
    return this.players.length;
  }

  getInfo() {
    return {
      status: this.status,
      players: this.players.map((item) => {
        return item.playerName
      }),
      results: this.results
    }
  }
}

exports.Games = Games;
exports.Game = Game;