var fs = require('fs');
var conf_file = '/etc/debade/debade.conf';
var config = {};

if (fs.existsSync(conf_file)) {
    config = JSON.parse(fs.readFileSync(conf_file, {encoding:'utf-8'}));
}

var get = function(pKey) {
    return config[pKey] || {};
};


exports.get = get;
