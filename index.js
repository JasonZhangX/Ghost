var oCheerio = require('cheerio');
var oSuperagent = require('superagent');
var oConfig = require('./data/config.json');

//
var oLoginRequest = oConfig.userList[0];

//Get cookie

//Get xsrf
var fGetXsft = function(fCallback) {
    oSuperagent.get(oConfig.zhihuAPI.login.url).end(function(oErr, oRes) {
        if (!oErr) {
            var $ = oCheerio.load(oRes.text);
            var sXsft = $('input[name=_xsrf]').attr('value');
            var bHasCaptcha = $('input[name=captcha]').length > 0;
            if (bHasCaptcha) {
                return console.log("Captcha!!!!!");
            }
            if (sXsft) {
                fCallback(sXsft);
            }
            console.log(sXsft);
        } else {
            console.dir(oErr);
        }
    });
}

//Send Request

//Login
var fLogin = function(sXsft) {
    oLoginRequest._xsrf = sXsft;
    oSuperagent.post(oConfig.zhihuAPI.login.url).set(oConfig.browser).send(oLoginRequest).redirects(0).end(function(oErr, oRes) {
        if (!oErr) {
            console.dir(oRes);
        } else {
            console.dir(oErr);
        }
    });
}

//Init
var fInit = function() {
    fGetXsft(fLogin);
}
fInit();
//console.log(oConfig);