export class GameController {

  constructor(socket) {
    'ngInject';
    this.socket = socket;
  }

  $onInit() {
    this.socket.on('user joined', function() {
      console.log('user joined');
    });
    this.socket.emit('room', this.room);
  }

  $onDestroy() {
    //this.socket.emit('leave room')
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