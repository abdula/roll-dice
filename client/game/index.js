import Player from './player.component';
import Game from './game.component';
import uiRouter from 'angular-ui-router';
import GameService from './game.service';
import Log from './log.component';
import Dice from './dice.component';
import socket from '../socket';
import angular from 'angular';

export default angular.module('game.game', [uiRouter, socket])
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'game',
      url: '/:room',
      template: '<game room="vm.room"></game>',
      controllerAs: 'vm',
      controller: function($stateParams) {
        'ngInject';

        this.room = $stateParams.room;
      }
    });
  })
  .factory('Game', GameService)
  .component('player', Player)
  .component('game', Game)
  .component('log', Log)
  .component('dice', Dice)
  .name;