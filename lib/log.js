var fs = require('fs');

var log_file = '/var/log/debade';

exports.log = function(pData) {
    fs.open(log_file, 'a+', function(pErr, pFd) {
        fs.write(pFd, pData.toString() + "\n", 0, 'utf-8', function(pE) {});
    });
};
