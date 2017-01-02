var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/user/', function(req, res, next) {
    console.log(req);
});

module.exports = router;