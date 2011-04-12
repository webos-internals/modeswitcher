function DefaultConfig(controller, prefs) {
	this.controller = controller;
	
	this.prefs = prefs;
}

//

DefaultConfig.prototype.appid = function(type) {
	if(type == "app")
		return "any";
}

//

DefaultConfig.prototype.setup = function() {
	this.choicesDefaultLaunchSelector = [
		{'label': $L("On Mode Start"), value: "start"},
		{'label': $L("On Mode Close"), value: "close"} ];  

	this.controller.setupWidget("DefaultLaunchSelector", {'label': $L("Launch"), 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesDefaultLaunchSelector} );
}

//

DefaultConfig.prototype.config = function(launchPoint) {
	var extensionConfig = {
		'name': launchPoint.title, 
		'appid': launchPoint.id,
		'launchMode': "start" };
	
	return extensionConfig;
}

//

DefaultConfig.prototype.load = function(extensionPreferences) {
	var extensionConfig = {
		'name': extensionPreferences.name,
		'appid': extensionPreferences.appid,
		'launchMode': extensionPreferences.event };
	
	return extensionConfig;
}

DefaultConfig.prototype.save = function(extensionConfig) {
	var extensionPreferences = {
		'type': "app",
		'name': extensionConfig.name,
		'event': extensionConfig.launchMode,
		'appid': extensionConfig.appid, 
		'params': "" };
	
	return extensionPreferences;
}

