/*
  http://codepen.io/HuyLy/pen/EbapJ
  https://codepen.io/jllodra/pen/hlsqv
*/

const dices = ['&#9856;', '&#9857;', '&#9858;', '&#9859;', '&#9860;', '&#9861;'];

class Controller {
  constructor($sce) {
    'ngInject';
    this.$sce = $sce;
  }

  getSymbolValue() {
    return this.$sce.trustAsHtml(dices[this.diceValue - 1]);
  }

  get classes() {
    const cls = [`dice-${this.diceSize}`];
    if (this.diceEnabled) {
      cls.push('enabled');
    } else {
      cls.push('disabled');
    }
    return cls;
  }
}


export default {
  bindings: {
    'diceSize': '@',
    'diceValue': '<',
    'diceEnabled': '<'
  },
  controllerAs: 'vm',
  controller: Controller,
  template: '<div class="dice" ng-class="vm.classes" ng-bind-html="vm.getSymbolValue()"></div>'
}