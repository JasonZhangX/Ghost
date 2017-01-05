var oCheerio = require('cheerio');
var oSuperagent = require('superagent');
var oConfig = require('./data/config.json');
var oExpress = require('express');
var path = require('path');
var oApp = oExpress();
var bodyParser = require('body-parser');
var oFileSystem = require('fs');

//Router
var rIndex = require('./routes/index');
var rUser = require('./routes/user');

//Init
var fInit = function () {
    fGetXsft(fLogin);
}

//Server 
oApp.use(bodyParser.json());
oApp.use(bodyParser.urlencoded({
    extended: false
}));
oApp.set('views', path.join(__dirname, 'views'));
oApp.set('view engine', 'ejs');
oApp.use(oExpress.static(__dirname + '/public'));
oApp.use('/', rIndex);

//
var oCookie = {};
var sXsft = '';
var sLoginUserEmail = '';

//Edit file
var fEditFile = function (sPath, sKey, fCallback) {
    var oFile = require(sPath);
    fCallback && fCallback(oFile[sKey]);
    oFileSystem.writeFile(sPath, JSON.stringify(oFile), function (oErr) {
        if (oErr) {
            return console.log(oErr);
        }
        console.log(JSON.stringify(oFile));
        console.log('Writing to ' + sPath);
    });
}

oApp.post('/xsrf', function (req, res) {
    // console.log(req.body.email);
    // console.log(req.body.password);
    //Get xsrf
    oSuperagent.get(oConfig.zhihuAPI.login.url).end(function (oErr, oRes) {
        if (!oErr) {
            var $ = oCheerio.load(oRes.text);
            var oLoginParam = {};
            oLoginParam.email = req.body.email;
            oLoginParam.password = req.body.password;
            oLoginParam.remember_me = false;
            sXsft = $('input[name=_xsrf]').attr('value');
            var bHasCaptcha = $('input[name=captcha]').length > 0;
            if (bHasCaptcha) {
                var sCaptchaImage = '';
                var bTextCaptcha = $('input[name=captcha_type]').val() === 'cn';
                if(!bTextCaptcha){
                    sCaptchaImage = $('.view-signin img.js-refreshCaptcha').attr('src');
                    ///captcha.gif?r=1483614565812&type=login
                    oLoginParam.captchaImage = sCaptchaImage ? 'http://www.zhihu.com' + sCaptchaImage : '';
                }else{
                    sCaptchaImage = $('.view-signin img.Captcha-image').attr('src');
                    ///captcha.gif?r=1483614049505&type=login&lang=cn
                    oLoginParam.captchaImage = sCaptchaImage ? 'http://www.zhihu.com' + sCaptchaImage : '';
                }
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
oApp.post('/login', function (req, oPostRes) {
    var oLoginRequest = {};
    oLoginRequest.email = req.body.email;
    oLoginRequest.password = req.body.password;
    oLoginRequest.remember_me = false;
    if (req.body.captcha) {
        oLoginRequest.captcha = req.body.captcha;
        if(typeof(oLoginRequest.captcha) === 'object'){
            oLoginRequest.captcha_type = 'cn';
        }
    }
    oLoginRequest._xsrf = sXsft;
    sLoginUserEmail = oLoginRequest.email;
    oSuperagent.post(oConfig.zhihuAPI.login.url).set({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://www.zhihu.com/',
        'X-Xsrftoken': sXsft
    }).send(oLoginRequest).redirects(0).end(function (oErr, oRes) {
        if (!oErr) {
            //Get cookie
            //z_c0
            oCookie = oRes.headers["set-cookie"];
            console.dir(oCookie);
            var oLoginStatus = oRes.body;
            oPostRes.send(oLoginStatus);
            fSetUid();
            oPostRes.end();
        } else {
            console.dir(oErr);
            oPostRes.end();
        }
    })
});

//Get user id
var fSetUid = function () {
    oSuperagent.get('https://www.zhihu.com').set({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Referer': 'https://www.zhihu.com',
        'Cookie': oCookie
    }).end(function (oErr, oRes) {
        if (!oErr) {
            console.log(oRes);
            //oPostRes.send(oRes.body);
            if (oRes.text) {
                var $ = oCheerio.load(oRes.text, {
                    decodeEntities: false
                });
                var sUserHomePage = $('.zu-top-nav-userinfo').attr('href');
                var sUserName = $('.zu-top-nav-userinfo .name').html();
                var sUid = sUserHomePage.replace('\/people\/', '');
                console.log('sUserName:%s', sUserName);
                console.log('sUid:%s', sUid);
                fEditFile('./data/config.json', 'userList', function (userList) {
                    for (var i = 0; i < userList.length; i++) {
                        if (sLoginUserEmail === userList[i].email) {
                            if (userList[i].name === undefined || userList[i].name === '') {
                                userList[i].name = sUserName;
                            }
                            if (userList[i].uid === undefined || userList[i].uid === '') {
                                userList[i].uid = sUid;
                            }
                            if (userList[i].url === undefined || userList[i].url === '') {
                                userList[i].url = 'https://www.zhihu.com' + sUserHomePage;
                            }
                        }

                    }
                });
            }
        } else {
            console.dir(oErr);
        }
    });
}

//Get user answer
oApp.post('/answer', function (req, oPostRes) {
    oSuperagent.get(oConfig.zhihuAPI.answer.url).set({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Referer': 'https://www.zhihu.com/people/heng-yuan-zhang',
        'Cookie': oCookie
    }).end(function (oErr, oRes) {
        if (!oErr) {
            console.log(oRes);
            oPostRes.send(oRes.body);
            oPostRes.end();
        } else {
            console.dir(oErr);
            oPostRes.end();
        }
    });
});

//logout
oApp.post('/logout', function (req, oPostRes) {
    oSuperagent.get(oConfig.zhihuAPI.logout.url).set({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Referer': 'https://www.zhihu.com/'
    }).end(function (oErr, oRes) {
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

//Vote
oApp.post('/vote', function (req, oPostRes) {
    var nAid = req.body.nAid;
    oSuperagent.post(oConfig.zhihuAPI.vote.url.replace('{aid}', nAid)).set({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Content-Type': 'application/json',
        'Referer': 'https://www.zhihu.com/',
        'Cookie': oCookie
    }).send({
        type: 'up'
    }).redirects(0).end(function (oErr, oRes) {
        if (!oErr) {
            //Get cookie
            //z_c0
            var oCount = oRes.body;
            oPostRes.send(oCount);
            oPostRes.end();
        } else {
            console.dir(oErr);
            oPostRes.end();
        }
    });
});

//Followers

var oServer = oApp.listen('3000', function () {
    var host = oServer.address().address;
    var port = oServer.address().port;
    //console.log('Diranme:%s', __dirname);
    console.log('Example app listening at http://%s:%s', host, port);
});
//console.log(oConfig);