var amqp = require('amqplib');
var cbk = require('./callback');
var log = require('./log').log;

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

    var handleMessage = function(pData, pChannel) {
        return function(pMessage) {
            cbk.run(pData, JSON.parse(pMessage.content.toString()), function() {
                pChannel.ack(pMessage);
            });
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
                return pChannel.consume(pQueue, handleMessage(pData, pChannel), {noAck: false});
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

    var conn;
    process.on('refresh-callback', function() {
        log('收到消息更新了callbacks.db');
        if (!conn) return;
        conn.close();
    });

    // 链接rabbitMQ服务器，接收消息
    var start = function() {
        log('尝试连接到AMQP Server...');
        amqp.connect(url).then(function(pConn) {
            conn = pConn;
            pConn.on('close', function() {
                log('刷新AMQP链接...');
                start();
                conn = undefined;
            });
            pConn.on('error', function(pError) {
                log('AMQP链接抖动...');
                start();
                conn = undefined;
            });
            var iChannel = pConn.createChannel();
            bindCallbacks(iChannel);
        }, function(pError) {
            log('Connect to AMQP Server Faild: ' + pError);
            start();
        }).then(null, console.warn);
    };

    start();
};

exports.run = run;

