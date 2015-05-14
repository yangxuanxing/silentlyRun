var silentlyRunner = require('../index');

var appName = process.argv[2];
if(!appName){
	return;
}
if(appName.indexOf('-') == 0){
	silentlyRunner.stop();
	return;
}

silentlyRunner.start(appName);
