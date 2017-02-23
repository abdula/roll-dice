import uiRouter from 'angular-ui-router';
import Dashboard from './dashboard.component';

export default angular.module('game.dashboard', [uiRouter])
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'dashboad',
      url: '/',
      template: '<dashboard></dashboard>'
    });
  })
  .component('dashboard', Dashboard)
  .name;