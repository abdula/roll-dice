const uuid = require('uuid');
const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('game');
const Moniker = require('moniker');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Game extends EventEmitter {
  constructor(room) {
    super();

    this.room = room;
    this.players = [];
    this.status = 'wait';
    this.results = [];
  }

  addPlayer(socket) {
    this.players.push(socket);
    this.emit('joined', socket);
  }

  removePlayer(socket) {
    this.players.slice(this.players.indexOf(socket), 1);
    this.emit('left', socket);
  }

  play(socket) {
    this.results.push({
      socket: socket,
      result: randomInt()
    });

    if (this.results.length === this.players) {
      this.emit('end', {
        result: this.result.slice(0)
      });
    }
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
    throw new Error('Not Implemented Yet');
  }

  hasPlayers() {
    return this.players.length;
  }

  getInfo() {
    return {
      status: this.status,
      players: this.players.map(this.playerToObj),
      results: this.results
    };
  }

  playerToObj(player) {
    return { id: player.id, name: player.playerName };
  }

}


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

  sendGameInfo(room, socket) {
    if (!room) {
      throw new Error('Room is not specified');
    }
    if (this.has(room)) {
      if (socket) {
        socket.emit('game.info', this.get('room').getInfo());
      }
      this.io.in(room).emit('game.info', this.get(room).getInfo());
    }
  }

  onConnect(socket) {
    if (!socket.playerName) {
      socket.playerName = Moniker.choose();
    }

    const onRoom = (room, cb) => {
      if (socket.room) {
        socket.leave(socket.room);
        this.get(socket.room).removePlayer(socket);
      }

      if (room) {
        socket.room = room;
        socket.join(room);

        this.get(room).addPlayer(socket);
      }
      cb({ id: socket.id });
    };

    const onPlay = (cb) => {
      if (!socket.room) return;

      try {
        cb({ result: this.get(socket.room).play(socket) });
      } catch (e) {
        //
      }
    };

    socket.on('room', onRoom);
    socket.on('play', onPlay);
    socket.on('disconnect', this.onDisconnect);
  }

  onDisconnect() {
    debug('disconnect');
  }

  generateRoom() {
    return uuid.v4();
  }

  has(room) {
    return this.games[room] ? true : false;
  }

  get(room) {
    if (!this.games[room]) {
      this.games[room] = this._create(room);
    }
    return this.games[room];
  }

  _create(room) {
    const game = new Game(room);

    game.on('joined', socket => {
      this.io.in(room).emit('players.joined', game.playerToObj(socket));
      this.sendGameInfo(room);
    });

    game.on('left', socket => {
      this.io.in(socket.room).emit('players.left', game.playerToObj(socket));

      if (!game.hasPlayers()) {
        this._destroyGame(game.room);
      } else {
        this.sendGameInfo(room);
      }
    });

    game.on('end', function() {
      this.io.in(game.room).emit('game.end', {});
      game.reset();
    });

    game.on('play', function(obj) {
      obj.socket.emit('result', obj.result);
    });

    return game;
  }

  _destroyGame(room) {
    if (this.games[room]) {
      this.games[room].removeAllListeners();
      delete this.games[room];
    }
  }
}


exports.Games = Games;
exports.Game = Game;