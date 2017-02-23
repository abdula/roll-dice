/**
 * Main application routes
 */

'use strict';

module.exports = function(app) {
  app.use('/api/roll-dice', require('./roll-dice'));
};