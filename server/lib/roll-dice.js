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

    this.minPlayers = 1;
    this.room = room;
    this.players = [];
    this.playing = false;
    this.results = [];
    this.nextRoundPlayers = [];
  }

  addPlayer(player) {
    this.players.push(player);
    if (this.playing) {
      this.nextRoundPlayers.push(player);
    }
    this.emit('joined', player);
  }

  removePlayer(player) {
    const index = this.players.indexOf(player);
    if (index === -1) {
      return false;
    }

    this.players.splice(index, 1);
    this.nextRoundPlayers.splice(this.nextRoundPlayers.indexOf(player), 1);

    this.emit('left', player);
  }

  getPlayerResult(player) {
    for (let i = 0; i < this.results.length; i++) {
      if (this.results[i].player === player) {
        return this.results[i];
      }
    }
    return false;
  }

  getWinners() {
    let winners = [];

    this.results.reduce((prev, item) => {
      if (prev < item.value) {
        winners = [item.player];
        return item.value;
      }

      if (prev === item.value) {
        winners.push(item.player);
      }

      return prev;
    }, 0);
    return winners;
  }

  getLoosers() {
    const winners = this.getWinners();
    return this.results.reduce((prev, item) => {
      if (winners.indexOf(item.player) === -1) {
        prev.push(item.player);
      }
      return prev;
    }, []);
  }

  play(player) {
    const numPlayers = this.players.length - this.nextRoundPlayers.length;

    if (numPlayers < this.minPlayers) {
      throw new Error(`Must be at least ${this.minPlayers} players`);
    }

    if (this.players.indexOf(player) === -1) {
      throw new Error('You can\'t play in this game');
    }

    if (this.nextRoundPlayers.indexOf(player) !== -1) {
      throw new Error('You will able to play in next round. Please wait.');
    }

    if (this.getPlayerResult(player) !== false) {
      throw new Error('You can\'t replay');
    }

    const result = {
      player: player,
      value: randomInt(1, 6)
    };

    this.results.push(result);

    if (!this.playing) {
      this.playing = true;
      this.emit('start');
    }

    process.nextTick(() => {
      this.emit('played', result);

      if (!this.getLeftToPlay()) {
        this.emit('end');
      }
    });


    return result;
  }

  getLeftToPlay() {
    return (this.players.length - this.nextRoundPlayers.length) - this.results.length;
  }

  getResults() {
    return this.results;
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
    this.emit('reset');
  }

  hasPlayers() {
    return this.players.length;
  }

  resultToObj(result) {
    return {
      player: this.playerToObj(result.player),
      value: result.value,
    };
  }

  playerToObj(player) {
    return { id: player.id, name: player.playerName };
  }

  getInfo() {
    return {
      playing: this.playing,
      players: this.players.map((player) => {
        const obj = this.playerToObj(player);
        obj.active = this.nextRoundPlayers.indexOf(player) === -1;
        return obj;
      }),
      results: this.results.map(item => this.resultToObj(item))
    };
  }

  getEndResult() {
    return {
      results: this.getResults().map(item => this.resultToObj(item)),
      winners: this.getWinners().map(item => this.playerToObj(item)),
      loosers: this.getLoosers().map(item => this.playerToObj(item))
    };
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

    const onJoin = (room, cb) => {
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

      const game = this.get(socket.room);
      try {
        const result = game.play(socket);
        cb({ value: result.value });
      } catch (e) {
        cb({ error: { message: e.message } });
        return;
      }
    };

    const onDiconnect = () => {
      if (socket.room) {
        this.get(socket.room).removePlayer(socket);
      }
    };

    socket.on('game.join', onJoin);
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

    debug('create', room);

    game.on('joined', socket => {
      debug('joined', socket.id, game.room);

      this.io.in(room).emit('game.joined', game.playerToObj(socket));
      this.sendGameInfo(room);
    });

    game.on('left', socket => {
      debug('left', socket.id, game.room);

      this.io.in(socket.room).emit('game.left', game.playerToObj(socket));

      if (!game.hasPlayers()) {
        this._destroyGame(game.room);
      } else {
        this.sendGameInfo(room);
      }
    });

    game.on('end', () => {
      debug('end', game.room);
      game.getWinners().forEach((socket) => {
        socket.emit('game.won');
      });

      game.getLoosers().forEach((socket) => {
        socket.emit('game.loose');
      });
      this.io.in(game.room).emit('game.end', game.getEndResult());
      game.reset();
    });

    game.on('reset', () => {
      this.sendGameInfo(game.room);
    });

    game.on('played', (result) => {
      debug('played', result.value, game.room);
      debug('left play', game.getLeftToPlay());

      const data = {
        player: game.playerToObj(result.player),
        value: result.value
      };
      this.io.in(game.room).emit('game.played', data);

      this.sendGameInfo(game.room);
    });

    return game;
  }

  _destroyGame(room) {
    debug('destroy', room);
    if (this.games[room]) {
      this.games[room].removeAllListeners();
      delete this.games[room];
    }
  }
}


exports.Games = Games;
exports.Game = Game;