function ImpostahConfig(controller, prefs) {
	this.controller = controller;
	
	this.prefs = prefs;
}

//

ImpostahConfig.prototype.appid = function(type) {
	return "org.webosinternals.impostah";
}

//

ImpostahConfig.prototype.setup = function() {
	this.choicesImpostahLaunchSelector = [
		{'label': $L("On Mode Start"), value: "start"},
		{'label': $L("On Mode Close"), value: "close"} ];  

	this.controller.setupWidget("ImpostahLaunchSelector", {'label': $L("Launch"), 
		'labelPlacement': "left", 'modelProperty': "impostahLaunchMode",
		'choices': this.choicesImpostahLaunchSelector} );

	this.choicesImpostahStartSelector = [
		{'label': $L("Do Nothing"), 'value': 0},
		{'label': $L("Restart Luna"), 'value': 1}];

	this.controller.setupWidget("ImpostahStartSelector", {'label': $L("On Start"), 
		'labelPlacement': "left", 'modelProperty': "impostahStartAction",
		'choices': this.choicesImpostahStartSelector});

	this.choicesImpostahCloseSelector = [
		{'label': $L("Do Nothing"), 'value': 0},
		{'label': $L("Restart Luna"), 'value': 1}];

	this.controller.setupWidget("ImpostahCloseSelector", {'label': $L("On Close"), 
		'labelPlacement': "left", 'modelProperty': "impostahCloseAction",
		'choices': this.choicesImpostahCloseSelector});
}

//

ImpostahConfig.prototype.config = function(launchPoint) {
	if(launchPoint.type == "app") {
		var appDisplay = "block";
		var srvDisplay = "none";
	}
	else {
		var appDisplay = "none";
		var srvDisplay = "block";
	}

	var extensionConfig = {
		'impostahName': launchPoint.title,
		'impostahAppType': launchPoint.type,
		'impostahLaunchMode': "start",
		'impostahStartAction': 0,
		'impostahCloseAction': 0,		
		'impostahAppCfgDisplay': appDisplay,
		'impostahSrvCfgDisplay': srvDisplay };
	
	return extensionConfig;
}

//

ImpostahConfig.prototype.load = function(extensionPreferences) {
	var startAction = 0;
	var closeAction = 0;
	
	if(extensionPreferences.type == "app") {
		var launchMode = extensionPreferences.event;
		
		var displayAppCfg = "block";
		var displaySrvCfg = "none";
	}
	else {	
		var launchMode = "none";

		var displayAppCfg = "none";
		var displaySrvCfg = "block";
		
		if(extensionPreferences.params.start != undefined)
			startAction = 1;
		else if(extensionPreferences.params.close != undefined)
			closeAction = 1;
	}
	
	var extensionConfig = {
		'impostahName': extensionPreferences.name,
		'impostahAppType': extensionPreferences.type,
		'impostahLaunchMode': launchMode,
		'impostahStartAction': startAction,
		'impostahCloseAction': closeAction,
		'impostahAppCfgDisplay': displayAppCfg,
		'impostahSrvCfgDisplay': displaySrvCfg };
	
	return extensionConfig;
}

ImpostahConfig.prototype.save = function(extensionConfig) {
	if(extensionConfig.impostahAppType == "app") {
		var extensionPreferences = {
			'type': "app",
			'name': extensionConfig.impostahName,
			'event': extensionConfig.impostahLaunchMode,
			'appid': this.appid(),
			'params': "" };
	}
	else {
		var params = {};

		if((extensionConfig.impostahStartAction == 0) &&
			(extensionConfig.impostahCloseAction == 0))
		{
			var event = "none";
		}
		else if((extensionConfig.impostahStartAction != 0) &&
			(extensionConfig.impostahCloseAction != 0))
		{
			var event = "both";

			params.start = "{id: 'org.webosinternals.ipkgservice', " +
				"service: 'org.webosinternals.ipkgservice', " +
				"method: 'restartLuna', params: {}}";
				
			params.close = "{id: 'org.webosinternals.ipkgservice', " +
				"service: 'org.webosinternals.ipkgservice', " +
				"method: 'restartLuna', prams: {}}";
		}
		else if(extensionConfig.impostahStartAction != 0) {
			var event = "start";

			params.start = "{id: 'org.webosinternals.ipkgservice', " +
				"service: 'org.webosinternals.ipkgservice', " +
				"method: 'restartLuna', params: {}}";
		}
		else if(extensionConfig.impostahCloseAction != 0) {
			var event = "close";

			params.close = "{id: 'org.webosinternals.ipkgservice', " +
				"service: 'org.webosinternals.ipkgservice', " +
				"method: 'restartLuna', prams: {}}";
		}		

		var extensionPreferences = {
			'type': "srv",
			'name': extensionConfig.impostahName,
			'event': event,
			'url': "palm://org.webosinternals.impostah",
			'method': "impersonate",
			'params': params };
	}
		
	return extensionPreferences;
}

