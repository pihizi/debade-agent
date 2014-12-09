var fs = require('fs');
var callbacks_file = '/etc/lib/debade/callbacks.db';
var rpc = require('./callback/http-jsonrpc');
var rest = require('./callback/rest');
var log = require('./log').log;

var write = function(pData) {
    try {
        fs.writeFileSync(callbacks_file, JSON.stringify(pData), {
            'encoding': 'utf-8'
        });
    }
    catch (error) {
        log(error);
        return false;
    }
    return true;
};

var getAll = function() {
    var iCallbacks = [];
    if (fs.existsSync(callbacks_file)) {
        try {
            iCallbacks = JSON.parse(fs.readFileSync(callbacks_file, {encoding: 'utf-8'}));
        }
        catch(e) {
        }
    }
    return iCallbacks;
};

var set = function(pData) {
    log('set callback: ' + JSON.stringify(pData));
    var iCallbacks  = getAll();
    iCallbacks = iCallbacks.filter(function(pObject) {
        if (pObject.channel===pData.channel && pObject.callback===pData.callback) {
            return false;
        }
        return true;
    });
    iCallbacks.push(pData);
    return write(iCallbacks);
};

var unset = function(pData) {
    log('unset callback: ' + JSON.stringify(pData));
    var iCallbacks  = getAll();
    var iHas = false, iResult = false;
    iCallbacks = iCallbacks.filter(function(pObject) {
        if (pObject.channel===pData.channel && pObject.callback===pData.callback) {
            iHas = true;
            return false;
        }
        return true;
    });
    if (iHas) {
        iResult = write(iCallbacks);
    }
    return iResult;
};

var run = function(pMethod, pData) {
    // 将message提交给callback进行处理
    var iData = pData.data;
    var iCallback = pMethod.callback;
    var iIndex = iCallback.indexOf(':');
    var iCType = iCallback.substr(0, iIndex);
    iCallback = JSON.parse(iCallback.substr(iIndex + 1));
    switch (iCType) {
        case 'rest':
            return rest.run(iCallback, iData);
            break;
        case 'http-jsonrpc':
            return rpc.run(iCallback, iData);
            break;
        default:
            log('Callback Type <' + iCType + '> Not Exists!');
    }
    return false;
};

exports.getAll = getAll;
exports.set = set;
exports.unset = unset;
exports.run = run;
