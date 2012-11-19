# requests-jail -

## Introduction

requests-jail is a middleware which stores requests until its "unleash" method is called.

## Usage
The module receives 2 parameters:
1. express application (mandatory): initialized by app = express();
2. an "options" object (optional) which contains the following key-value pair: {match: <regexp>}
   The request's path will be matched against the regexp pattern.
   When a match is detected the request will be delayed.

The following demonstrates usage of requests-jail:.

```javascript
var express = require('express');
app = express();
var reqJail = require('requests-jail')(app, {match: /^(?!\/$)/});

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

## License

MIT
