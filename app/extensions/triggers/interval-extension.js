function IntervalConfig(controller, prefs) {
	this.controller = controller;

	this.prefs = prefs;
}

//

IntervalConfig.prototype.label = function() {
	return $L("Time Interval Trigger");
}

//

IntervalConfig.prototype.setup = function() {
	this.controller.setupWidget("IntervalIntervalHours",
	 	{label: ' ', modelProperty: 'intervalIntervalHours', min: 0, max: 24 }); 

	this.controller.setupWidget("IntervalIntervalMinutes",
	 	{label: ' ', modelProperty: 'intervalIntervalMinutes', min: 0, max: 60 }); 

	this.controller.setupWidget("IntervalActiveHours",
	 	{label: ' ', modelProperty: 'intervalActiveHours', min: 0, max: 24 }); 

	this.controller.setupWidget("IntervalActiveMinutes",
	 	{label: ' ', modelProperty: 'intervalActiveMinutes', min: 0, max: 60 }); 
}

//

IntervalConfig.prototype.config = function() {
	var extensionConfig = {
		'intervalTitle': $L("Time Interval"),
		'intervalIntervalHours': 0,
		'intervalIntervalMinutes': 0,
		'intervalActiveHours': 0,
		'intervalActiveMinutes': 0 };
	
	return extensionConfig;
}

//

IntervalConfig.prototype.load = function(extensionPreferences) {
	var extensionConfig = {
		'intervalTitle': $L("Time Interval"),
		'intervalIntervalHours': extensionPreferences.intervalHours,
		'intervalIntervalMinutes': extensionPreferences.intervalMinutes,
		'intervalActiveHours': extensionPreferences.activeHours,
		'intervalActiveMinutes': extensionPreferences.activeMinutes };

	return extensionConfig;
}

IntervalConfig.prototype.save = function(extensionConfig) {
	var extensionPreferences = {
		'intervalHours': extensionConfig.intervalIntervalHours,
		'intervalMinutes': extensionConfig.intervalIntervalMinutes,
		'activeHours': extensionConfig.intervalActiveHours, 
		'activeMinutes': extensionConfig.intervalActiveMinutes };
	
	return extensionPreferences;
}

