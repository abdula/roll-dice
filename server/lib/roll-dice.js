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
    this.playing = false;
    this.results = [];
    this.nextRoundPlayers = [];
  }

  addPlayer(socket) {
    this.players.push(socket);
    if (this.playing) {
      this.nextRoundPlayers.push(socket);
    }
    this.emit('joined', socket);
  }

  removePlayer(socket) {
    const index = this.players.indexOf(socket);
    if (index === -1) {
      return false;
    }

    this.players.splice(index, 1);
    this.nextRoundPlayers.splice(this.nextRoundPlayers.indexOf(socket), 1);

    this.emit('left', socket);
  }

  getPlayerResult(socket) {
    for (let i = 0; i < this.results.length; i++) {
      if (this.results[i].socket === socket) {
        return this.results[i];
      }
    }
    return false;
  }

  getWinners() {
    const winners = [];

    this.results.reduce((prev, item) => {
      if (prev < item.value) {
        winners = [item.socket];
        return item.value;
      }

      if (prev === item.value) {
        winners.push(item.socket);
      }

      return prev;
    }, 0);
  }

  getLoosers() {
    const winners = this.getWinners();
    this.results.reduce((prev, item) => {
      if (winners.indexOf(item.socket) === -1) {
        prev.push(item.socket);
      }
      return prev;
    }, []);
  }

  play(socket) {
    const numPlayers = this.players.length - this.nextRoundPlayers.length;

    if (numPlayers < 2) {
      throw new Error('Must be at least 2 players');
    }

    if (this.players.indexOf(socket) === -1) {
      throw new Error('You can\'t play in this game');
    }

    if (this.nextRoundPlayers.indexOf(socket) === -1) {
      throw new Error('You can\'t play in next round. Please wait');
    }

    if (this.getPlayerResult(socket) !== false) {
      throw new Error('You can\'t replay');
    }

    if (!this.playing) {
      this.playing = true;
      this.emit('start');
    }

    this.results.push({
      socket: socket,
      result: randomInt(1, 6)
    });

    if (this.results.length === this.players.length - this.nextRoundPlayers.length) {
      this.emit('end', {
        result: this.result.slice(0),
        winners: this.getWinners(),
        loosers: this.getLoosers()
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
    this.playing = false;
    this.results = [];
    this.nextRoundPlayers = [];
  }

  hasPlayers() {
    return this.players.length;
  }

  getInfo() {
    return {
      playing: this.playing,
      players: this.players.map((player) => {
        const obj = this.playerToObj(player);
        obj.active = this.nextRoundPlayers.indexOf(player) === -1;
        return obj;
      }),
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

    const onGameJoin = (room, cb) => {
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
        cb({ error: e });
      }
    };

    const onDiconnect = () => {
      if (socket.room) {
        this.get(socket.room).removePlayer(socket);
      }
    };

    socket.on('game.join', onGameJoin);
    socket.on('game.play', onPlay);
    socket.on('disconnect', onDiconnect);
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
      this.io.in(room).emit('game.joined', game.playerToObj(socket));
      this.sendGameInfo(room);
    });

    game.on('left', socket => {
      this.io.in(socket.room).emit('game.left', game.playerToObj(socket));

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