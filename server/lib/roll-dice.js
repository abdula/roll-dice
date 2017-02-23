const uuid = require('uuid');
const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('game');

//https://github.com/michaeldegroot/roomdata/blob/master/roomdata.js

function Games(io) {
  this.io = io;

  let games = {};

  this.generateRoom = function() {
    return uuid.v4();
  }

  this.has = function(room) {
    return games.hasOwnProperty(room);
  }

  this.get = function(room) {
    if (!games[room]) {
      games[room] = this._create(room, this.io);
    }
    return games[room];
  }

  this._create = function(room) {
    const game = new Game(room, io);

    game.on('disconnect', function() {
      if (!game.getNumPlayers()) {
        this._destroyGame(game.room);
      }
    });
  }

  this._destroyGame = function(room) {
    delete games[room];
  }
}

class Game extends EventEmitter {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.players = [];
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

  getNumPlayers() {
    return this.players.length;
  }


  // this.playerThrow = function() {

  // }

  // this.getNumPlayers = function() {

  //   }
  //this.emit('close')
}

exports.Games = Games;
exports.Game = Game;