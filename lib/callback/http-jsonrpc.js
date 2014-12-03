var http = require('http');
var qs = require('querystring');
var log = require('../log').log;

var run = function(pCallbackInfo, pData) {
    var iData = qs.stringify({data: JSON.stringify(pData)});
    var iOptions = {
        host: pCallbackInfo.host || '',
        port: pCallbackInfo.port || 80,
        path: pCallbackInfo.path || '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': iData.length,
            token: pCallbackInfo.token
        }
    };
    var request = http.request(iOptions, function(response) {
        response.setEncoding('utf8');
        response.on('data', function(ppData) {
            if (ppData!==true) {
                log('Server Response Error: ' + ppData + '<===' + JSON.stringify(pCallbackInfo) + '<---' + JSON.stringify(pData));
            }
        });
    });
    request.on('error', function(error) {
        log('Request Failed: ' + JSON.stringify(pCallbackInfo) + '<---' + JSON.stringify(pData));
    });
    request.write(iData);
    request.end();
};

exports.run = run;
