function DisplayConfig(controller, prefs) {
	this.controller = controller;

	this.prefs = prefs;
}

//

DisplayConfig.prototype.label = function() {
	return $L("Display State Trigger");
}

//

DisplayConfig.prototype.setup = function() {
	this.choicesStateSelector = [
		{'label': $L("Locked"), 'value': 1},
		{'label': $L("Unlocked"), 'value': 0} ];  

	this.controller.setupWidget("DisplayStateSelector", {'label': $L("State"), 
		'labelPlacement': "left", 'modelProperty': "displayLocked",
		'choices': this.choicesStateSelector});
}

//

DisplayConfig.prototype.config = function() {
	var extensionConfig = {
		'displayTitle': $L("Display State"),
		'displayLocked': 1 };
	
	return extensionConfig;
}

//

DisplayConfig.prototype.load = function(extensionPreferences) {
	var locked = 1;
	
	if(!extensionPreferences.locked)
		locked = 0;

	var extensionConfig = {
		'displayTitle': $L("Display State"),
		'displayLocked': locked };
	
	return extensionConfig;
}

DisplayConfig.prototype.save = function(extensionConfig) {
	var locked = true;

	if(extensionConfig.displayLocked == 0)
		locked = false;

	var extensionPreferences = {
		'locked': locked };
	
	return extensionPreferences;
}

