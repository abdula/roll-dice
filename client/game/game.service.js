import angular from 'angular';

export default function GameService($http, $q) {
  'ngInject';

  function Game(room) {

  }

  return {
    createGame: function() {
      return $http.post('/api/roll-dice', {}).then((response) => {
        return response.data;
      });
    },
    game: function(room) {
      return new Game(room);
    }
  }
}