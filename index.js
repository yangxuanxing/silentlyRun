var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');
var util = require('util');

var pathPid = path.resolve(__dirname, '.running');
var pathLog = path.resolve(require.main.filename, '../silently-run.log');

function showError(strError) {
    console.log('\x1b[31m' + strError + '\x1b[0m');
};

// check if pid exist
function checkRunning(pid, callback) {
    if (!Number(pid)) {
        callback && callback(null, false);
        return;
    }

    var cmd = process.platform == 'win32' ? 'tasklist /fi "PID eq %s"' : 'ps -p %s';
    cmd = util.format(cmd, pid);

    childProcess.exec(cmd, function(checkErr, out) {
        if (checkErr) {
            callback && callback(checkErr, null);
            return;
        }

        var strPid = String(pid);
        if (String(out).indexOf(strPid) != -1) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    });
}

function start(appPath) {
    stop(function(stopError){
        if(!stopError){
            _start(appPath);
        }
    });
}

function _start(appPath) {
    var fsLog = fs.openSync(pathLog, 'w');
    var streamLog = fs.createReadStream(pathLog);
    streamLog.on('data', function(data){
        console.log('script error!');
        console(String(data));
    });

    var child = childProcess.spawn('node', [appPath], {
        detached: true,
        stdio: ['ignore', 'ignore', fsLog]
    });

    console.log('Starting ' + appPath);
    var timerNoError = setTimeout(function () {
        fs.writeFileSync(pathPid, child.pid);
        child.unref();
        console.log('Service Started!');
    }, 3000);

    child.on('exit', function (code) {
        clearTimeout(timerNoError);
        showError('script exit! See silently-run.log');
    });
    
}

function stop(callback) {
    var stopError = null;
    if (!fs.existsSync(pathPid)) {
        if (callback) {
            callback(stopError);
        }
        return;
    }

    var pid = fs.readFileSync(pathPid, {
        encoding: 'utf8'
    });
    if (!pid) {
        if (callback) {
            callback(stopError);
        }
        return;
    }

    checkRunning(pid, function(checkErr, isRunning) {
        if (isRunning) {
            try {
                process.kill(pid);
            } catch (killError) {
                stopError = killError;
                showError('Error: Cannot kill ' + pid + '\n' + killError);
            }
        }
        if (!stopError) {
            fs.writeFileSync(pathPid, '');
        }
        if (callback) {
            callback(stopError);
        }
    });
}

exports.start = start;
exports.stop = stop;

if(module.parent){
    return;
}
var appName = process.argv[2];
if(!appName){
    return;
}
if(appName.indexOf('-') == 0){
    stop(function(err){
        console.log(err || 'Service Stopped!');
    });
    return;
}

start(appName);