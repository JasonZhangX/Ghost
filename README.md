# Ghost
Traffic flow system.


##Zhihu API
- Login
  - URL: https://www.zhihu.com/login/email
  - Param: 
  	- email
  	- password
  	- _xsrf
  	- captcha
- Log out
	-URL: https://www.zhihu.com//logout

- Followers 
	  -URL: https://www.zhihu.com/api/v4/members/{user-name}/followers

- Vote
	- URL: https://www.zhihu.com/api/v4/answers/{problem-id}/voters
	- Param:
		- {type: "up"}

##Reference Documentation

###Implement
https://www.cnblogs.com/Lumia1020/p/5329945.html
https://github.com/shanelau/zhihu

###Tools
https://www.npmjs.com/package/cheerio
https://www.npmjs.com/package/superagent
https://www.npmjs.com/package/express
https://github.com/expressjs/body-parser
http://www.expressjs.com.cn/starter/hello-world.html

###Email Account
http://www.hao123.com/mail
http://www.benpig.com/mail.htm
http://24mail.chacuo.net/
http://mail.bccto.me/
http://www.yopmail.com/zh/
http://www.benpig.com/linshi.htm

###Admin UI
https://www.zhihu.com/question/19990259

###Others
https://segmentfault.com/a/1190000003851057
https://cnodejs.org/topic/5203a71844e76d216a727d2e