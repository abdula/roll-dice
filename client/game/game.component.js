export class GameController {

  constructor(socket) {
    'ngInject';
    this.socket = socket;
    this.players = [];
    this.log = [];
    this.game = {
      status: 'wait'
    };
  }

  writeToLog(data, type) {
    this.log.push({
      type,
      data
    });
    return this;
  }

  $onInit() {
    this.socket.on('game.info', (game) => {
      this.players = game.players;
      this.game = {
        status: game.status,
      };
    });

    this.socket.on('players.leave', (player) => {
      this.writeToLog({ player }, 'players.leave');
    });

    this.socket.on('players.joined', (player) => {
      this.writeToLog({ player }, 'players.join');
    });

    this.socket.emit('room', this.room);
  }

  $onDestroy() {
    this.socket.removeListener('players.join');
    this.socket.removeListener('players.leave');
    this.socket.removeListener('game.info');
  }
}

export default {
  bindings: {
    room: '<'
  },
  controller: GameController,
  controllerAs: 'vm',
  template: require('./game.pug'),
}