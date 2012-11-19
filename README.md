# node-requests-jail #

[![Build Status](https://secure.travis-ci.org/anodejs/node-requests-jail.png?branch=master)](http://travis-ci.org/anodejs/node-requests-jail)

## Introduction ##

node-requests-jail is a middleware which stores requests until its "unleash" method is called.

## Usage ##
The module receives 2 parameters:

1. express application (mandatory): initialized by app = express();
2. an "options" object (optional) which contains the following key-value pair: {match: <regexp>}
   The request's path will be matched against the regexp pattern.
   When a match is detected the request will be delayed.

The following example demonstrates usage of requests-jail.
In this case all the requests are delayed by the requests-jail middleware until some "longAction" finishes
and the middleware's unleash method is called.


```javascript
var express = require('express');
app = express();
var reqJail = require('node-requests-jail')(app);

app.use(express.bodyParser());
app.use(reqJail);
app.listen(5000);

app.get('/', function(req, res) {
  res.send('Hello from root', 200);
});

//Long action that must finish before requests are released.
longAction(function(err) {
  console.info("long action is done");
  reqJail.unleash();
});
```

The following example demonstrates usage of requests-jail with the optional 'match' parameter.
In this example the match value is a regular expression which matches each path which is not the root path.
In this case all the requests will be delayed by the requests-jail middleware except requests with path = '/'

```javascript
var express = require('express');
app = express();
var reqJail = require('node-requests-jail')(app, {match: /^(?!\/$)/});

app.use(express.bodyParser());
app.use(reqJail);
app.listen(5000);

app.get('/', function(req, res) {
  res.send('Hello from root', 200);
});

app.get('/name', function(req, res) {
  res.send('Hello from name page', 200);
});

//Long action that must finish before requests are released.
longAction(function(err) {
  console.info("long action is done");
  reqJail.unleash();
});
```

## License ##

MIT
