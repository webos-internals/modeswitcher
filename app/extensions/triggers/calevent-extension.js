function CaleventConfig(controller, prefs) {
	this.controller = controller;

	this.prefs = prefs;
}

//

CaleventConfig.prototype.label = function() {
	return $L("Calendar Event Trigger");
}

//

CaleventConfig.prototype.setup = function() {
	this.choicesCaleventCalendarSelector = [
		{'label': $L("Any Calendar"), 'value': "any"} ];
		
	this.controller.setupWidget("CaleventCalendarSelector", {'label': $L("Calendar"),
		'labelPlacement': "left", 'modelProperty': "caleventCalendar",
		'choices': this.choicesCaleventCalendarSelector});

	this.choicesCaleventMatchSelector = [
		{'label': $L("Match"), 'value': "match"},
		{'label': $L("No Match"), 'value': "nomatch"} ];
		
	this.controller.setupWidget("CaleventMatchSelector", {'label': $L("Active On"),
		'labelPlacement': "left", 'modelProperty': "caleventMode",
		'choices': this.choicesCaleventMatchSelector});

	this.controller.setupWidget("CaleventMatchText", {'hintText': $L("Text to Match in Events"), 
		'multiline': false, 'enterSubmits': false, 'focus': true, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "caleventMatch"}); 

	this.retrieveCalendarAccounts();
}

//

CaleventConfig.prototype.config = function() {
	var extensionConfig = {
		'caleventTitle': $L("Calendar Event"),
		'caleventCalendar': "any",
		'caleventMode': "match",
		'caleventMatch': "" };
	
	return extensionConfig;
}

//

CaleventConfig.prototype.load = function(extensionPreferences) {
	var extensionConfig = {
		'caleventTitle': $L("Calendar Event"),
		'caleventCalendar': extensionPreferences.calendar,
		'caleventMode': extensionPreferences.matchMode,
		'caleventMatch': extensionPreferences.matchText };
	
	return extensionConfig;
}

CaleventConfig.prototype.save = function(extensionConfig) {
	var extensionPreferences = {
		'calendar': extensionConfig.caleventCalendar,
		'matchMode': extensionConfig.caleventMode,
		'matchText': extensionConfig.caleventMatch };
	
	return extensionPreferences;
}

//

CaleventConfig.prototype.retrieveCalendarAccounts = function() {
	this.controller.serviceRequest('palm://org.webosinternals.impersonate/', {'method': "systemCall",
		'parameters': {'id': "com.palm.app.calendar", 'service': "com.palm.db", 'method': "find", 
			'params': {'query': {'from':"com.palm.calendar:1"}}},
		'onSuccess': this.handleCalendarAccounts.bind(this) });
}

CaleventConfig.prototype.handleCalendarAccounts = function(serviceResponse) {
	this.choicesCaleventCalendarSelector.clear();
	
	this.choicesCaleventCalendarSelector.push({'label': $L("Any Calendar"), 'value': "any"});

	for(var i = 0; i < serviceResponse.results.length; i++) {
		this.choicesCaleventCalendarSelector.push({
			'label': serviceResponse.results[i].name, 
			'value': serviceResponse.results[i]._id});
	}
	
	var state = this.controller.get('mojo-scene-mode-scene-scroller').mojo.getState();

	this.controller.get("TriggersList").mojo.invalidateItems(0);
	
	this.controller.get('mojo-scene-mode-scene-scroller').mojo.setState(state);	
}

