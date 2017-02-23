//http://codepen.io/HuyLy/pen/EbapJ
//https://codepen.io/jllodra/pen/hlsqv
let dices = ['&#9856;', '&#9857;', '&#9858;', '&#9859;', '&#9860;', '&#9861;'];

class Controller {
  constructor($sce) {
    'ngInject';
    this.$sce = $sce;

  }

  getSymbolValue() {
    return this.$sce.trustAsHtml(dices[this.value - 1]);
  }
}


export default {
  bindings: {
    value: '<'
  },
  controllerAs: 'vm',
  controller: Controller,
  template: '<div class="dice" ng-bind-html="vm.getSymbolValue()"></div>'
}