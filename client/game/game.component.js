function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class GameController {

  constructor(socket, SweetAlert, $timeout, $interval) {
    'ngInject';

    this.$timeout = $timeout;
    this.$interval = $interval;
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
      status: 'wait',
      results: []
    };
  }

  haveIWait() {
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
        description: 'You have to wait wile the game is finished'
      };
    }

    if (this.haveIWait()) {
      return {
        code: -102,
        description: 'You have to wait wile the game is finished'
      };
    }

    return {
      code: 100,
      description: 'Click to play'
    };
  }

  writeToLog(data, type) {
    this.log.push({
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
        }
      });
    }, 3000);
  }

  $onInit() {
    this.socket.on('game.info', (game) => {
      this.players = game.players;
      this.game = {
        status: game.status,
        results: game.results
      };
    });

    ['game.end', 'game.won', 'game.end', 'game.loose', 'game.played', 'game.left', 'game.joined'].forEach((event) => {
      this.socket.on(event, (result) => {
        this.writeToLog(result, event);
      });
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
}