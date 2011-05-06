function ModechangeConfig(controller, prefs) {
	this.controller = controller;

	this.prefs = prefs;
}

//

ModechangeConfig.prototype.label = function() {
	return $L("Mode Change Trigger");
}

//

ModechangeConfig.prototype.setup = function() {
	this.choicesModeStateSelector = [
		{'label': $L("Mode Active"), 'value': 0},
		{'label': $L("Mode Not Active"), 'value': 1} ];  

	this.controller.setupWidget("ModechangeStateSelector", {'label': $L("State"), 
		'labelPlacement': "left", 'modelProperty': "modechangeState",
		'choices': this.choicesModeStateSelector});

	this.choicesModeNameSelector = [
		{'label': $L("Default Mode"), 'value': "Default Mode"} ];  

	this.controller.setupWidget("ModechangeModeSelector", {'label': $L("Mode"), 
		'labelPlacement': "left", 'modelProperty': "modechangeMode",
		'choices': this.choicesModeNameSelector});

	this.controller.listen(this.controller.get("TriggersList"), Mojo.Event.listTap, 
		this.helpItemTapped.bind(this));

	this.retrieveModes();
}

//

ModechangeConfig.prototype.config = function() {
	var extensionConfig = {
		'modechangeTitle': $L("Mode Change"),
		'modechangeState': 0,
		'modechangeMode': "Default Mode" };
	
	return extensionConfig;
}

//

ModechangeConfig.prototype.load = function(extensionPreferences) {
	var state = 0;
	
	if(extensionPreferences.state != "on")
		state = 1;

	var extensionConfig = {
		'modechangeTitle': $L("Mode Change"),
		'modechangeState': state,
		'modechangeMode': extensionPreferences.mode };
	
	return extensionConfig;
}

ModechangeConfig.prototype.save = function(extensionConfig) {
	var state = "on";
	
	if(extensionConfig.modechangeState == 1)
		state = "off";

	var extensionPreferences = {
		'state': state,
		'mode': extensionConfig.modechangeMode };
	
	return extensionPreferences;
}

//

ModechangeConfig.prototype.helpItemTapped = function(event) {
	if(event.originalEvent.target.id == "ModechangeStateHelp") {
		var helpTitle = "State";

		var helpText = "Required state of the mode that determines if this mode should be active or not.";
	}
	else if(event.originalEvent.target.id == "ModechangeModeHelp") {
		var helpTitle = "Mode";

		var helpText = "Name of the mode of the mode that determines if this mode should be active or not.";
	}
	else
		return;
	
	this.controller.showAlertDialog({
		title: helpTitle,
		message: "<div style='text-align:justify;'>" + helpText + "</div>",
		choices:[{"label": "Close", "command": "close"}],
		preventCancel: false,
		allowHTMLMessage: true
	});
}

//

ModechangeConfig.prototype.retrieveModes = function() {
	this.controller.serviceRequest('palm://org.webosinternals.modeswitcher.srv', {
		'method': 'prefs', 'parameters': {'keys': ["customModes"]},
		'onSuccess': this.handleModeData.bind(this)} );
}

ModechangeConfig.prototype.handleModeData = function(response) {
	this.choicesModeNameSelector.clear();

	this.choicesModeNameSelector.push({'label': "Any Normal Mode", 'value': "Any Normal Mode"});
	this.choicesModeNameSelector.push({'label': "Any Modifier Mode", 'value': "Any Modifier Mode"});

	for(var i = 0; i < response.customModes.length; i++) {
		if(this.controller.get("NameText").mojo.getValue() != response.customModes[i].name)
			this.choicesModeNameSelector.push({'label': response.customModes[i].name, 'value': response.customModes[i].name});
	}
	
	var state = this.controller.get('mojo-scene-mode-scene-scroller').mojo.getState();

	this.controller.get("TriggersList").mojo.invalidateItems(0);
		
	this.controller.get('mojo-scene-mode-scene-scroller').mojo.setState(state);
}

