// debade-agent的守护进程，负责调度agent、server等功能
var fs = require('fs');
var fork = require('child_process').fork;
var log = require('./log').log;

var process_id_file = '/tmp/gini-debade-agent.pid';
var workers = {};

var createWorker = function(pAppPath) {
    log('尝试启动> ' + pAppPath);
    var iWorker = fork(pAppPath);
    var iPid = iWorker.pid;
    workers[iPid] = iWorker;

    iWorker.on('message', function(pMessage) {
        for (var tWid in workers) {
            if (iPid==tWid) continue;
            workers[tWid].send(pMessage);
        }
    });

    iWorker.on('exit', function() {
        delete workers[iPid];
        createWorker(pAppPath);
    });
};

process.on('SIGINT', function() {
    for (var tPid in workers) {
        workers[tPid].kill('SIGINT');
    }
    process.exit(0);
});

var stop = function() {
    var iPid;
    if (fs.existsSync(process_id_file)) {
        iPid = fs.readFileSync(process_id_file, {
            'encoding': 'utf-8'
        });
        fs.unlinkSync(process_id_file);
    }
    if (iPid) {
        try {
            process.kill(iPid, 'SIGINT');
        }
        catch(e) {}
    }
};

var start = function(pAppsPath) {
    stop();
    pAppsPath.forEach(function(pAppPath) {
        createWorker(pAppPath);
    });
    fs.writeFileSync(process_id_file, process.pid, {
        'encoding': 'utf-8'
    });
};

exports.start = start;
exports.stop = stop;
