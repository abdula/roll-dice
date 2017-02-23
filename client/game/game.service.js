export default function GameService($http) {
  'ngInject';

  return {
    createGame: function() {
      return $http.post('/api/roll-dice', {}).then((response) => {
        return response.data;
      });
    }
  };
}