var express = require('express');
var router = express.Router();
var oConfig = require('../data/config.json');
var aUserList = oConfig.userList;

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { users: aUserList });
});

module.exports = router;