export default {
  template: require('./dashboard.pug'),
  controllerAs: 'vm',
  controller: function(Game, $state) {
    'ngInject';

    this.createGame = function() {
      Game.createGame().then((data) => {
        $state.go('game', { room: data.room });
      });
    };

    this.connectGame = function() {
      throw new Error('Not implmeneted yet');
    };
  }
};