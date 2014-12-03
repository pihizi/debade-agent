var amqp = require('amqplib');
var cbk = require('./callback');
var log = require('./log').log;
var conn;

var run = function() {
    var url = (function() {
        var iConfig = require('./config').get('agent');
        var iServer = iConfig['server'] || 'localhost';
        var iUser = iConfig['user'] || 'guest';
        var iPassword = iConfig['password'] || 'guest';
        var iPort = iConfig['port'] || '5672';
        return 'amqp://' + iUser + ':' + iPassword + '@' + iServer + ':' + iPort;
    })();

    log('获取rabbitMQ URL: ' + url);

    var handleMessage = function(pData) {
        return function(pMessage) {
            cbk.run(pData, JSON.parse(pMessage.content.toString()));
        };
    };

    var handleChannel = function(pData) {
        return function(pChannel) {
            var iOk = pChannel.assertExchange(pData.channel, 'fanout', {durable: false, autoDelete: true});
            iOk = iOk.then(function() {
                return pChannel.assertQueue('', {exclusive: false, autoDelete: true});
            });
            iOk = iOk.then(function(pQok) {
                return pChannel.bindQueue(pQok.queue, pData.channel, '').then(function() {
                    return pQok.queue;
                });
            });
            iOk = iOk.then(function(pQueue) {
                return pChannel.consume(pQueue, handleMessage(pData), {noAck: false});
            });
            return pChannel;
        };
    };

    var bindCallbacks = function(pChannel) {
        log('绑定到rabbitMQ Channel: ' + pChannel);
        var iCallbacks = cbk.getAll();
        iCallbacks.forEach(function(pCallback) {
            pChannel.then(handleChannel(pCallback));
        });
    };

    // 链接rabbitMQ服务器，接收消息
    var start = function() {
        amqp.connect(url).then(function(pConn) {
            pConn.on('close', function() {
                log('刷新AMQP链接...');
                start();
            });
            conn = pConn;
            var iChannel = pConn.createChannel();
            bindCallbacks(iChannel);
        }).then(null, console.warn);
    };

    start();
};

var restart = function() {
    if (conn && conn.close) {
        conn.close();
    }
};

exports.run = run;
exports.restart = restart;

