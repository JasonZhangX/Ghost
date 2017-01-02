var oCheerio = require('cheerio');
var oSuperagent = require('superagent');
var oConfig = require('./data/config.json');
var oExpress = require('express');
var path = require('path');
var oApp = oExpress();
var bodyParser = require('body-parser');

//Router
var rIndex = require('./routes/index');
var rUser = require('./routes/user');

//Init
var fInit = function() {
    fGetXsft(fLogin);
}

//Server 
oApp.use(bodyParser.json());
oApp.use(bodyParser.urlencoded({ extended: false }));
oApp.set('views', path.join(__dirname, 'views'));
oApp.set('view engine', 'ejs');
oApp.use(oExpress.static(__dirname + '/public'));
oApp.use('/', rIndex);

//
var oCookie = {};
var sXsft = "";
oApp.post('/xsrf', function(req, res) {
    // console.log(req.body.email);
    // console.log(req.body.password);
    //Get xsrf
    oSuperagent.get(oConfig.zhihuAPI.login.url).end(function(oErr, oRes) {
        if (!oErr) {
            var $ = oCheerio.load(oRes.text);
            var oLoginParam = {};
            oLoginParam.email = req.body.email;
            oLoginParam.password = req.body.password;
            oLoginParam.remember_me = false;
            sXsft = $('input[name=_xsrf]').attr('value');
            var bHasCaptcha = $('input[name=captcha]').length > 0;
            if (bHasCaptcha) {
                var sCaptchaImage = $('img.js-refreshCaptcha').attr('src');
                oLoginParam.captchaImage = sCaptchaImage ? 'http://www.zhihu.com' + sCaptchaImage : '';
                console.log("Captcha:%s!!!!!", sCaptchaImage);
            }
            if (sXsft) {
                oLoginParam._xsrf = sXsft;
            }
            res.send(oLoginParam);
            res.end();
            console.log(oLoginParam);
        } else {
            console.dir(oErr);
            res.end();
        }
    });

});

//Login
oApp.post('/login', function(req, oPostRes) {
    var oLoginRequest = {};
    oLoginRequest.email = req.body.email;
    oLoginRequest.password = req.body.password;
    oLoginRequest.remember_me = false;
    if (req.body.captcha) {
        oLoginRequest.captcha = req.body.captcha;
    }
    oLoginRequest._xsrf = sXsft;
    oSuperagent.post(oConfig.zhihuAPI.login.url).set({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://www.zhihu.com/',
        'X-Xsrftoken': sXsft
    }).send(oLoginRequest).redirects(0).end(function(oErr, oRes) {
        if (!oErr) {
            //Get cookie
            //z_c0
            oCookie = oRes.headers["set-cookie"];
            console.dir(oCookie);
            var oLoginStatus = oRes.body;
            oPostRes.send(oLoginStatus);
            oPostRes.end();
        } else {
            console.dir(oErr);
            oPostRes.end();
        }
    });
});

var parseCookie = function(cookie) {
    var cookies = {};
    if (!cookie) {
        return cookie;
    }
    var list = cookie.split(';');
    for (var i = 0; i < list.length; i++) {
        var pair = list[i].split('=');
        cookies[pair[0].trim()] = pair[1];
    }
    return cookies;
};
//Get user answer
oApp.post('/answer', function(req, oPostRes) {

    oSuperagent.get(oConfig.zhihuAPI.answer.url).set({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Referer': 'https://www.zhihu.com/people/heng-yuan-zhang',
        'authorization': '',
    }).end(function(oErr, oRes) {
        if (!oErr) {
            console.log(oRes);
            var answers = {};
            oPostRes.send(answers);
            oPostRes.end();
        } else {
            console.dir(oErr);
            oPostRes.end();
        }
    });
});

oApp.post('/logout', function(req, oPostRes) {
    oSuperagent.get(oConfig.zhihuAPI.logout.url).set({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Referer': 'https://www.zhihu.com/'
    }).end(function(oErr, oRes) {
        if (!oErr) {
            oCookie = oRes.headers["set-cookie"];
            console.dir(oCookie);
            var oLogoutStatus = oRes.body;
            oPostRes.send(oLogoutStatus);
            oPostRes.end();
        } else {
            console.dir(oErr);
            oPostRes.end();
        }
    });
});

var oServer = oApp.listen('3000', function() {
    var host = oServer.address().address;
    var port = oServer.address().port;
    //console.log('Diranme:%s', __dirname);
    console.log('Example app listening at http://%s:%s', host, port);
});
//console.log(oConfig);