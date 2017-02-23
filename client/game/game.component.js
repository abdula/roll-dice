function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class GameController {

  constructor(socket, SweetAlert, $timeout, $interval, $log) {
    'ngInject';

    this.$timeout = $timeout;
    this.$interval = $interval;
    this.$log = $log;
    this.SweetAlert = SweetAlert;

    this.socket = socket;
    this.players = [];
    this.log = [];
    this.status = null;
    this.lastValue = null;
    this.socketId = null;

    this.minPlayers = 1;

    this.maxDice = 6;
    this.minDice = 1;

    this.activeValue = randomInt(this.minDice, this.maxDice);

    this.game = {
      playing: false,
      results: [],
      players: []
    };
  }

  getMe() {
    for (let i = 0, l = this.players.length; i < l; i++) {
      const player = this.players[i];
      if (player.id === this.socketId) {
        return player;
      }
    }
    return false;
  }

  get canIPlay() {
    if (this.players.length < this.minPlayers) {
      return {
        code: -100,
        description: `Players must be at least ${this.minPlayers}`
      };
    }

    if (this.lastValue) {
      return {
        code: -101,
        description: 'Please wait wile the round completed'
      };
    }

    const me = this.getMe();
    if (!me || !me.active) {
      return {
        code: -102,
        description: 'Please wait wile the round completed'
      };
    }

    return true;
  }

  writeToLog(data, type) {
    this.log.unshift({
      type,
      data
    });
    return this;
  }

  play() {
    const timer = this.$interval(() => {
      this.activeValue = randomInt(this.minDice, this.maxDice);
    }, 200);

    this.$timeout(() => {
      this.socket.emit('game.play', (result) => {
        this.$interval.cancel(timer);
        if (!result.error) {
          this.activeValue = result.value;
          this.lastValue = this.activeValue;
        } else {
          this.$log.error(result.error);
        }
      });
    }, 1000);
  }

  $onInit() {
    this.socket.on('game.info', (game) => {
      this.players = game.players;
      this.game = game;
    });

    ['game.end', 'game.played', 'game.left', 'game.joined'].forEach((event) => {
      this.socket.on(event, (result) => {
        this.$log.debug(event, result);
        this.writeToLog(result, event);
      });
    });

    this.socket.on('game.end', () => {
      this.lastValue = null;
    });

    this.socket.on('game.won', () => {
      this.SweetAlert.swal('Congrats!', 'You are the winners!', 'success');
    });

    this.socket.on('game.loose', () => {
      this.SweetAlert.swal('You loose this time.');
    });

    this.socket.emit('game.join', this.room, (result) => {
      this.socketId = result.id;
    });
  }

  $onDestroy() {
    const events = ['game.joined', 'game.left', 'game.info', 'game.won', 'game.end', 'game.loose', 'game.played'];

    events.forEach((event) => {
      this.removeListener(event);
    }, this.socket);
  }
}

export default {
  bindings: {
    room: '<'
  },
  controller: GameController,
  controllerAs: 'vm',
  template: require('./game.pug'),
};