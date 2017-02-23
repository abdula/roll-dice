import io from 'socket.io-client';
import 'angular-socket-io';
import angular from 'angular';

export default angular.module('game.socket', ['btford.socket-io'])
  .factory('socket', function(socketFactory) {
    'ngInject';
    const ioSocket = io.connect();

    return socketFactory({
      ioSocket: ioSocket
    });
  })
  .name;