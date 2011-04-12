function SilentswConfig(controller, prefs) {
	this.controller = controller;

	this.prefs = prefs;
}

//

SilentswConfig.prototype.label = function() {
	return $L("Silent Switch Trigger");
}

//

SilentswConfig.prototype.setup = function() {
	this.choicesSwitchStateSelector = [
		{'label': $L("Switch On"), 'value': 1},
		{'label': $L("Switch Off"), 'value': 0} ];  

	this.controller.setupWidget("SilentswStateSelector", {'label': $L("State"), 
		'labelPlacement': "left", 'modelProperty': "silentswState",
		'choices': this.choicesSwitchStateSelector});
}

//

SilentswConfig.prototype.config = function() {
	var extensionConfig = {
		'silentswTitle': $L("Silent Switch"),
		'silentswState': 1 };
	
	return extensionConfig;
}

//

SilentswConfig.prototype.load = function(extensionPreferences) {
	var state = 1;
	
	if(extensionPreferences.state == "up")
		state = 0;

	var extensionConfig = {
		'silentswTitle': $L("Silent Switch"),
		'silentswState': state };
	
	return extensionConfig;
}

SilentswConfig.prototype.save = function(extensionConfig) {
	var state = "down";
	
	if(extensionConfig.silentswState == 0)
		state = "up";
	
	var extensionPreferences = {
		'state': state };
	
	return extensionPreferences;
}

