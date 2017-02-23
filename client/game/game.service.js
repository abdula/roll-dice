import angular from 'angular';

export default function GameService($http, $q) {
  'ngInject';

  return {
    createGame: function() {
      return $http.post('/game', {}).then((response) => {
        return response.data;
      });
    }
  }
}