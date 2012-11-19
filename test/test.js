var testCase = require('nodeunit').testCase;
var request = require('request');
var express = require('express');

var history;
var app;
var port;
var srv;

function compareStates(expectedStates) {
  if (expectedStates.length !==  history.length) return false;
  for (var i = 0; i< expectedStates.length; i++) {
    if (expectedStates[i] !==  history[i]) return false;
  }
  return true;
}

module.exports = testCase({

  setUp: function (callback) {
    history = [];

    // express 3.0 compatibility issue:
    // in express 3.0 express applications no longer inherit from http.Server.
    // therefore, we cannot close the server by using app.close().
    // the following code is a workaround
    if (typeof(express) === 'function') { // express 3.0
      app = express();
      srv = require('http').createServer(app);
      port = srv.listen().address().port;
    }
    else { //express 2.5
      app = express.createServer();
      srv = app.listen();
      port = srv.address().port;
    }
    callback();
  },
  // basic delay test.
  basic: function (test) {

    var reqJail = require('node-requests-jail')(app);

    //  middleware, called BEFORE requestJail
    var before = function (req, res, next){
      history.push('before');

      next();

      var payload = req.body;
      if (payload.id === 'first request') {
        test.ok(compareStates( ['before']),  "Before unleash,  history array should only contain before");
        var stackSizeBeforeUnleash = app.stack.length;
        reqJail.unleash();

        test.equals(app.stack.length, stackSizeBeforeUnleash-1,  "Stack size after unleash should decrease by 1");
        test.ok(compareStates(['before', 'after', 'Request Done']),  "After unleash,  history array should contain before, after, Request Done");
      }
      else if (payload.id === 'second request') {
        var curStates = ['before', 'after', 'Request Done', 'before', 'after', 'Request Done'];
        test.ok(compareStates(curStates),  "second request,  history array should contain before, after, Request Done, before, after, Request Done");
      }
    }

    // middleware, called AFTER requestJail
    var after = function (req, res, next){
      history.push('after');
      next();
    }

    app.use(express.bodyParser());
    app.use(before);
    app.use(reqJail);
    app.use(after);

    app.post('/', function(req, res) {
      history.push('Request Done');
      res.send('Hello', 200);
    });

    var target ='localhost:'+port;

    request({
      method: 'POST',
      json: true,
      body: { id: 'first request' },
      url: 'http://' + target
    }, function(err, res, body) {
      test.ok(compareStates( ['before', 'after', 'Request Done']),  "first request done");

      request({
        method: 'POST',
        json: true,
        body: { id: 'second request'},
        url: 'http://' + target
      }, function(err, res, body) {
        test.ok(compareStates( ['before', 'after', 'Request Done', 'before', 'after', 'Request Done']),  "second request done");
        test.equal(res.statusCode, 200, "status code should be 200");

        srv.close();
        test.done();
      });
    });
  },

  // Delay some of the requests, according to their path
  pathDependent: function (test) {

    var reqJail = require('node-requests-jail')(app, {match: /^(?!\/$)/});

    //  middleware, called BEFORE requestJail
    var before = function (req, res, next){
      history.push('before');

      next();

      var payload = req.body;
      if (payload.id === 'first request') {
        test.ok(compareStates( ['before', 'Request Done']),  "Jail should pass request - path doesn't match");
      }
      else if (payload.id === 'second request') {
        test.ok(compareStates(['before', 'Request Done', 'before']),  "second request should be stuck in jail - path match");
        reqJail.unleash();
        var curStates = ['before',  'Request Done', 'before', 'Request Done'];
        test.ok(compareStates(curStates),  "After unleash - second request should complete as well");
      }
    }

    app.use(express.bodyParser());
    app.use(before);
    app.use(reqJail);

    app.post('/', function(req, res) {
      history.push('Request Done');
      res.send('Hello', 200);
    });

    app.post('/bla', function(req, res) {
      history.push('Request Done');
      res.send('Hello', 200);
    });

    var target ='localhost:'+port;

    request({
      method: 'POST',
      json: true,
      body: { id: 'first request' },
      url: 'http://' + target
    }, function(err, res, body) {
      test.ok(compareStates( ['before', 'Request Done']),  "first request done");

      request({
        method: 'POST',
        json: true,
        body: { id: 'second request'},
        url: 'http://' + target + '/bla'
      }, function(err, res, body) {
        test.equal(res.statusCode, 200, "status code should be 200");

        srv.close();
        test.done();
      });
    });
  }

});