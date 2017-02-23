'use strict';

import angular from 'angular';
import uiRouter from 'angular-ui-router';
import dashboard from './dashboard';
import game from './game';
import SweetAlert from 'angular-sweetalert';

import "sweetalert/lib/sweet-alert.css"
import "./app.css"

angular.module('game', [uiRouter, dashboard, game, 'oitozero.ngSweetAlert'])
  .config(function routeConfig($urlRouterProvider, $locationProvider) {
    'ngInject';

    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
  })
  .run(function($rootScope, $location) {
    'ngInject';
  });

angular.element(document)
  .ready(() => {
    angular.bootstrap(document, ['game'], {
      strictDi: true
    });
  });