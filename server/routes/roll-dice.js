'use strict';

const express = require('express');
const router = express.Router();
const register = require('../lib/register');

router.post('/', function(req, res, next) {
  res.json({
    room: register.get('rollDice').generateRoom()
  });
});

module.exports = router;