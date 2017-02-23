export default {
  template: require('./dashboard.pug'),
  controllerAs: 'vm',
  controller: function(Game, $state, SweetAlert, $window) {
    'ngInject';

    this.createGame = function() {
      Game.createGame().then((data) => {
        const link = $window.location.origin + '/' + data.room;

        SweetAlert.swal({
          html: true,
          title: 'Wellcome',
          text: `Send this link to your friends to play together<br><br><strong>${link}</strong>`
        }, function() {
          $state.go('game', { room: data.room });
        });
      });
    };

    this.connectGame = function() {
      throw new Error('Not implmeneted yet');
    };
  }
}