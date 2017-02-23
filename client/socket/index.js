import io from 'socket.io-client';
import 'angular-socket-io';

export default angular.module('game.socket', ['btford.socket-io'])
  .factory('socket', function(socketFactory) {
    'ngInject';
    var ioSocket = io.connect();

    return socketFactory({
      ioSocket: ioSocket
    });
  })
  .name;