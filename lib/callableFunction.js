'use strict';

var _ = require('lodash');

var CallableFunction = function(trigger, controller) {
	this.name = trigger.name;
  this.eventTrigger = trigger.eventTrigger;
  this.httpsTrigger = trigger.httpsTrigger;
	this.controller = controller;
};

var _isDatabaseFunc = function(eventTrigger) {
  return /firebase.database/.test(eventTrigger.resource);
};

var _substituteParams = function(resource, params) {
  var wildcards = resource.match(new RegExp('{[^/{}]*}', 'g'));
  _.forEach(wildcards, function(wildcard) {
    var wildcardNoBraces = wildcard.slice(1,-1);
    var sub = _.get(params, wildcardNoBraces); // .slice removes '{' and '}' from wildcard
    if (sub) {
      resource = _.replace(resource, wildcard, sub);
    } else {
      resource = _.replace(resource, wildcard, wildcardNoBraces + '1');      
    }
  });
  return resource;
}
	
CallableFunction.prototype.call = function(data, opts) {
    // TODO: fake auth
  opts = opts || {};
  if (this.httpsTrigger) {
    this.controller.call(this.name, data || {});
  }
  else if (this.eventTrigger) {
    if (_isDatabaseFunc(this.eventTrigger)) {
      var dataPayload = {
        data: opts.previous,
        delta: data
      }
      opts.resource = _substituteParams(this.eventTrigger.resource, opts.params);
      this.controller.call(this.name, dataPayload, opts);

    } else {
      this.controller.call(this.name, data || {}, opts);
    }
  }
};

module.exports = CallableFunction;