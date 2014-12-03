#! /usr/bin/env node


var server = require('./lib/server');
var agent = require('./lib/agent');

agent.run();
server.run();
