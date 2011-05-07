function ModeswConfig(controller, prefs) {
	this.controller = controller;

	this.prefs = prefs;
	
	this.modesList = [];

	this.choicesModeswModeSelector = [{'label': $L("Previous Mode"), 'value': "Previous Mode"}];
}

//

ModeswConfig.prototype.appid = function(type) {
	if(type == "ms")
		return "org.webosinternals.modeswitcher";
}

//

ModeswConfig.prototype.setup = function() {
	this.choicesModeswProcessSelector = [
		{'label': $L("Before Mode Start"), value: "start"},
		{'label': $L("Before Mode Close"), value: "close"},
		{'label': $L("Before Mode Switch"), value: "switch"},
		{'label': $L("After Mode Start"), value: "started"},
		{'label': $L("After Mode Close"), value: "closed"},
		{'label': $L("After Mode Switch"), value: "switched"} ];  

	this.controller.setupWidget("ModeswProcessSelector", {'label': $L("Execute"), 
		'labelPlacement': "left", 'modelProperty': "modeProcess",
		'choices': this.choicesModeswProcessSelector});
	
	this.choicesModeswActionSelector = [
		{'label': $L("Start Mode"), value: "start"},
		{'label': $L("Close Mode"), value: "close"},
		{'label': $L("Trigger Mode"), value: "trigger"},
		{'label': $L("Enable Triggers"), value: "unlock"},
		{'label': $L("Disable Triggers"), value: "lock"} ];  

	this.controller.setupWidget("ModeswActionSelector", {'label': $L("Action"), 
		'labelPlacement': "left", 'modelProperty': "modeAction",
		'choices': this.choicesModeswActionSelector});

	this.controller.setupWidget("ModeswModeSelector", {'label': $L("Mode"), 
		'labelPlacement': "left", 'modelProperty': "modeName",
		'choices': this.choicesModeswModeSelector});

	this.controller.listen(this.controller.get("AppsList"), Mojo.Event.listTap, 
		this.helpItemTapped.bind(this));

	// Listen for change event for action selector
	
	this.controller.listen(this.controller.get("AppsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));

	this.retrieveModes();
}

//

ModeswConfig.prototype.config = function(launchPoint) {
	this.updateModesList("start");	

	var extensionConfig = {
		'name': launchPoint.title,
		'modeProcess': "start", 
		'modeAction': "start", 
		'modeName': "Previous Mode",
		'modeActionRow': "",
		'modeModeDisplay': "block" };
	
	return extensionConfig;
}

//

ModeswConfig.prototype.load = function(extensionPreferences) {
	var row = "";
	var display = "block";

	if((extensionPreferences.action == "unlock") || (extensionPreferences.action == "lock")) {
		row = "last";
		display = "none";
	}
	else {
		this.updateModesList(extensionPreferences.action);	
	}
	
	var extensionConfig = {
		'name': extensionPreferences.name,	
		'modeProcess': extensionPreferences.event, 
		'modeAction': extensionPreferences.action, 
		'modeName': extensionPreferences.mode,
		'modeActionRow': row,
		'modeModeDisplay': display };
	
	return extensionConfig;
}

ModeswConfig.prototype.save = function(extensionConfig) {
	var force = "no";

	if((extensionConfig.modeProcess == "switch") || (extensionConfig.modeProcess == "switched"))
		force = "yes";
	
	var extensionPreferences = {
		'type': "ms",
		'name': extensionConfig.name,
		'event': extensionConfig.modeProcess,
		'action': extensionConfig.modeAction,
		'mode': extensionConfig.modeName, 
		'force': force };
	
	return extensionPreferences;
}

//

ModeswConfig.prototype.helpItemTapped = function(event) {
	if(event.originalEvent.target.id == "ModeswProcessHelp") {
		var helpTitle = "Execute";

		var helpText = "Determines when the action is executed, before or after processing modes settings and apps.<br><br><b>Before/After Mode Start:</b> before/after processing when this mode is started.<br><b>Before/After Mode Close:</b> before/after processing when this mode is closed.<br><b>Before Mode Switch:</b> before processing when switched to this mode.<br><b>After Mode Switch:</b> after processing when switched to this mode.";
	}
	else if(event.originalEvent.target.id == "ModeswActionHelp") {
		var helpTitle = "Action";

		var helpText = "Action to be executed when processed. Can be used to start/close/trigger modes and to enable/disable triggers. Trigger mode means that mode is started if its triggers are valid and closed if its triggers are not valid.";
	}
	else if(event.originalEvent.target.id == "ModeswModeHelp") {
		var helpTitle = "Mode";

		var helpText = "Mode or modes to start/close/trigger. If you change the target modes name then you need to remove and re-add this configuration.";
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

ModeswConfig.prototype.retrieveModes = function() {
	this.controller.serviceRequest('palm://org.webosinternals.modeswitcher.srv', {
		'method': 'prefs', 'parameters': {'keys': ["customModes"]},
		'onSuccess': this.handleModeData.bind(this)} );
}

ModeswConfig.prototype.handleModeData = function(serviceResponse) {
	this.modesList.clear();
	
	this.modesList.push({'label': $L("All Normal Modes"), 'value': "All Normal Modes", 'type': "alln"});  	
	this.modesList.push({'label': $L("All Modifier Modes"), 'value': "All Modifier Modes", 'type': "allm"});  	
	this.modesList.push({'label': $L("Current Mode"), 'value': "Current Mode", 'type': "current"});  
	this.modesList.push({'label': $L("Previous Mode"), 'value': "Previous Mode", 'type': "previous"});  

	for(var i = 0; i < serviceResponse.customModes.length; i++) {
		this.modesList.push({
			'label': serviceResponse.customModes[i].name, 
			'value': serviceResponse.customModes[i].name, 
			'type': serviceResponse.customModes[i].type});  
	}
}

//

ModeswConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "modeAction") {
		this.choicesModeswModeSelector.clear();

		if((changeEvent.value == "unlock") || (changeEvent.value == "lock")) {
			changeEvent.model.modeActionRow = "last";
			changeEvent.model.modeModeDisplay = "none";
		}
		else {
			changeEvent.model.modeActionRow = "";
			changeEvent.model.modeModeDisplay = "block";

			this.updateModesList(changeEvent.value);	
			
			if(changeEvent.value == "start")
				changeEvent.model.modeName = "Previous Mode";
			else if(changeEvent.value == "close")
				changeEvent.model.modeName = "Current Mode";
			else if(changeEvent.value == "trigger")
				changeEvent.model.modeName = "Previous Mode";
		}
		
		var state = this.controller.get('mojo-scene-mode-scene-scroller').mojo.getState();

		this.controller.get("AppsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-mode-scene-scroller').mojo.setState(state);
	}
}

ModeswConfig.prototype.updateModesList = function(listType) {
	this.choicesModeswModeSelector.clear();

	for(var i = 0; i < this.modesList.length; i++) {
		if(listType == "start") {
			if((this.modesList[i].type != "current") && (this.modesList[i].type != "default") &&
				(this.modesList[i].type != "alln")) 
			{
				if(this.controller.get("NameText").mojo.getValue() != this.modesList[i].value)
					this.choicesModeswModeSelector.push(this.modesList[i]);
			}
		}
		else if(listType == "close") {
			if((this.modesList[i].type == "current") || (this.modesList[i].type == "modifier") ||
				(this.modesList[i].type == "allm"))
			{
				this.choicesModeswModeSelector.push(this.modesList[i]);
			}
		}
		else if(listType == "trigger") {
			if((this.modesList[i].type != "current") && (this.modesList[i].type != "default")) {
				if(this.controller.get("NameText").mojo.getValue() != this.modesList[i].value)
					this.choicesModeswModeSelector.push(this.modesList[i]);
			}
		}
	}		
}

