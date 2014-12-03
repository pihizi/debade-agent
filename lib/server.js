var cbk = require('./callback');
var http = require('http');
var qs = require('querystring');
var url = require('url');
var log = require('./log').log;

var refreshCallback = function() {
    process.emit('refresh-callback');
};

var run = function() {
    var server = http.createServer();
    server.on('request', function(pRequest, pResponse) {
        var iMethod = pRequest.method;
        if (iMethod!=='POST') {
            pResponse.end();
            log('Server仅接收POST请求!');
            return;
        }

        var iData = '';
        pRequest.on('data', function(pChunk) {
            iData += pChunk;
        });

        pRequest.on('end', function() {
            var iPath = url.parse(pRequest.url).pathname.substr(1).toLowerCase();
            iData = qs.parse(iData.toString());
            switch (iPath) {
                case 'register':
                    log('Register New Callback.');
                    if (cbk.set(iData)) {
                        refreshCallback();
                    }
                    break;
                case 'unregister':
                    log('UnRegister Callback.');
                    if (cbk.unset(iData)) {
                        refreshCallback();
                    }
                    break;
                default:
                    log('Unsupported Request Path: ' + iPath);
            }
            pResponse.end();
        });
    });

    server.on('error', function(pError) {
        log('Server Error: ' + pError.message);
    });

    var config = require('./config').get('server');
    var port = config.port || 80;
    log('启动server, 监听' + port + '端口, 接收register/unregister请求。');
    server.listen(port);
};

exports.run = run;

