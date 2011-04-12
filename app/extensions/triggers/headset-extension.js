function HeadsetConfig(controller, prefs) {
	this.controller = controller;

	this.prefs = prefs;
}

//

HeadsetConfig.prototype.label = function() {
	return $L("Headset State Trigger");
}

//

HeadsetConfig.prototype.setup = function() {
	this.choicesStateSelector = [
		{'label': $L("Connected"), 'value': 0}, 
		{'label': $L("Not Connected"), 'value': 1} ];  

	this.controller.setupWidget("HeadsetStateSelector", {'label': $L("State"), 
		'labelPlacement': "left", 'modelProperty': "headsetState",
		'choices': this.choicesStateSelector});

	this.choicesScenarioSelector = [
		{'label': $L("Any Scenario"), 'value': 0}, 
		{'label': $L("Headset"), 'value': 1},
		{'label': $L("Headset / Mic"), 'value': 2} ];  

	this.controller.setupWidget("HeadsetScenarioSelector", {'label': $L("Scenario"), 
		'labelPlacement': "left", 'modelProperty': "headsetScenario",
		'choices': this.choicesScenarioSelector});
}

//

HeadsetConfig.prototype.config = function() {
	var extensionConfig = {
		'headsetTitle': $L("Headset State"),
		'headsetState': 0,
		'headsetScenario': 0 };
	
	return extensionConfig;
}

//

HeadsetConfig.prototype.load = function(extensionPreferences) {
	var extensionConfig = {
		'headsetTitle': $L("Headset State"),
		'headsetState': extensionPreferences.state,
		'headsetScenario': extensionPreferences.scenario };
	
	return extensionConfig;
}

HeadsetConfig.prototype.save = function(extensionConfig) {
	var extensionPreferences = {
		'state': extensionConfig.headsetState,
		'scenario': extensionConfig.headsetScenario };
	
	return extensionPreferences;
}

