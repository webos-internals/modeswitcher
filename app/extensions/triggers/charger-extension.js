function ChargerConfig(controller, prefs) {
	this.controller = controller;

	this.prefs = prefs;
}

//

ChargerConfig.prototype.label = function() {
	if(this.prefs.advancedPrefs)
		return $L("Charger Event Trigger");
}

//

ChargerConfig.prototype.setup = function() {
	this.choicesChargerSelector = [
		{'label': $L("No Charger"), 'value': "none"},
		{'label': $L("Touchstone"), 'value': "ts"},
		{'label': $L("Wall Charger"), 'value': "wall"},
		{'label': $L("USB Charger"), 'value': "pc"} ];  

	this.controller.setupWidget("ChargerSourceSelector",	{'label': $L("Charger"), 
		'labelPlacement': "left", 'modelProperty': "chargerCharger",
		'choices': this.choicesChargerSelector});

	this.choicesOrientationSelector = [
		{'label': $L("Any"), 'value': "any"},
		{'label': $L("Left"), 'value': "left"},
		{'label': $L("Right"), 'value': "right"},
		{'label': $L("Up"), 'value': "up"},
		{'label': $L("Down"), 'value': "down"} ];  

	this.controller.setupWidget("ChargerOrientationSelector", {'label': $L("Orientation"), 
		'labelPlacement': "left", 'modelProperty': "chargerOrientation",
		'choices': this.choicesOrientationSelector});
	
	// Listen for change event for charger selector
	
	this.controller.listen(this.controller.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

ChargerConfig.prototype.config = function() {
	var extensionConfig = {
		'chargerTitle': $L("Charger Event"),
		'chargerSourceRow': "first",
		'chargerOrientationDisplay': "block",
		'chargerCharger': "ts",
		'chargerOrientation': "any" };
	
	return extensionConfig;
}

//

ChargerConfig.prototype.load = function(extensionPreferences) {
	if(extensionPreferences.charger == "ts") {
		var row = "first";
		var display = "block";
	}
	else {
		var row = "single";
		var display = "none";
	}

	var extensionConfig = {
		'chargerTitle': $L("Charger Event"),
		'chargerSourceRow': row, 
		'chargerOrientationDisplay': display, 
		'chargerCharger': extensionPreferences.charger,
		'chargerOrientation': extensionPreferences.orientation };
	
	return extensionConfig;
}

ChargerConfig.prototype.save = function(extensionConfig) {
	if(extensionConfig.chargerCharger != "ts")
		var orientation = "any";
	else
		var orientation = extensionConfig.chargerOrientation;

	var extensionPreferences = {
		'charger': extensionConfig.chargerCharger,
		'orientation': orientation};
	
	return extensionPreferences;
}

//

ChargerConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "chargerCharger") {
		if(changeEvent.model.chargerCharger == "ts") {
			changeEvent.model.chargerSourceRow = "first";
			changeEvent.model.chargerOrientationDisplay = "block";
		}
		else {
			changeEvent.model.chargerSourceRow = "single";
			changeEvent.model.chargerOrientationDisplay = "none";
		}
			
		var state = this.controller.get('mojo-scene-mode-scene-scroller').mojo.getState();

		this.controller.get("TriggersList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-mode-scene-scroller').mojo.setState(state);
	}
}

