function BrowserConfig(controller, prefs) {
	this.controller = controller;
	
	this.prefs = prefs;
}

//

BrowserConfig.prototype.appid = function(type) {
	if(type == "app")
		return "com.palm.app.browser";
}

//

BrowserConfig.prototype.setup = function() {
	this.choicesBrowserLaunchSelector = [
		{'label': $L("On Mode Start"), value: "start"},
		{'label': $L("On Mode Close"), value: "close"}];  

	this.controller.setupWidget("BrowserLaunchSelector", {'label': $L("Launch"), 
		'labelPlacement': "left", 'modelProperty': "launchMode",
		'choices': this.choicesBrowserLaunchSelector});

	// URL text field
			
	this.controller.setupWidget("BrowserURLText", { 'hintText': $L("Enter URL to load..."), 
		'multiline': false, 'enterSubmits': false, 'focus': false, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "launchURL"});
}

//

BrowserConfig.prototype.config = function(launchPoint) {
	var url = "";

	if((launchPoint.params) && (launchPoint.params.url))
		url = launchPoint.params.url;

	var extensionConfig = {
		'name': launchPoint.title,
		'launchMode': "start", 
		'launchURL': url };
	
	return extensionConfig;
}

//

BrowserConfig.prototype.load = function(extensionPreferences) {
	var launchURL = "";
	
	try {eval("var params = " + extensionPreferences.params);} catch(error) {var params = "";}

	if(params.target != undefined)
		launchURL = params.target;

	var extensionConfig = {
		'name': extensionPreferences.name,
		'launchMode': extensionPreferences.event, 
		'launchURL': launchURL };
	
	return extensionConfig;
}

BrowserConfig.prototype.save = function(extensionConfig) {
	var params = "";

	if(extensionConfig.launchURL.length != 0)
		params = "{target: '" + extensionConfig.launchURL + "'}";

	var extensionPreferences = {
		'type': "app",
		'name': extensionConfig.name,
		'event': extensionConfig.launchMode,
		'appid': this.appid(), 
		'params': params };
	
	return extensionPreferences;
}

