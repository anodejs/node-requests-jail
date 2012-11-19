module.exports = function (srv, options) {

  var queue = []; // Stores the context of the request handlers

  var requestsJail = function (req, res, next){
    if (!options || !options.match || options.match.test(req.path))  {
      queue.push(next);
    }
    else {
      next();
    }
  }

  requestsJail.unleash = function () {
    queue.forEach(function (next) {
      next();
    });
    unuse();
  }

  // Removes middleware from the middlewares stack
  function unuse() {
    var handlerIndex = -1;
    for(var i = 0; i < srv.stack.length; i++) {
      if (srv.stack[i] && (srv.stack[i].handle === requestsJail)) {
        handlerIndex = i;
      }
    }
    if (handlerIndex > -1) {
      srv.stack.splice(handlerIndex, 1);
    }
  }

  return requestsJail;
}

