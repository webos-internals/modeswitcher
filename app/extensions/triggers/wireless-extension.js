function WirelessConfig(controller, prefs) {
	this.controller = controller;

	this.prefs = prefs;
}

//

WirelessConfig.prototype.label = function() {
	return $L("Wi-Fi Network Trigger");
}

//

WirelessConfig.prototype.setup = function() {
	this.choicesWiFiStateSelector = [
		{'label': $L("Connected"), 'value': 0},
		{'label': $L("Disconnected"), 'value': 1},
		{'label': $L("Connected to"), 'value': 2},
		{'label': $L("Disconnected from"), 'value': 3} ];  

	this.controller.setupWidget("WirelessStateSelector", {'label': $L("State"), 
		'labelPlacement': "left", 'modelProperty': "wirelessState",
		'choices': this.choicesWiFiStateSelector});

	this.controller.setupWidget("WirelessSSIDText", {'hintText': $L("Wi-Fi Network Name (SSID)"), 
		'multiline': false, 'enterSubmits': false, 'focus': true, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "wirelessSSID"}); 

	// Listen for state selector change event

	this.controller.listen(this.controller.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

WirelessConfig.prototype.config = function() {
	var extensionConfig = {
		'wirelessTitle': $L("Wi-Fi Network"),
		'wirelessStateRow': "single",
		'wirelessSSIDDisplay': "none",
		'wirelessState': 0,
		'wirelessSSID': "" };
	
	return extensionConfig;
}

//

WirelessConfig.prototype.load = function(extensionPreferences) {
	var row = "single";	
	var display = "none";

	if(extensionPreferences.state >= 2) {
		var row = "first";
		var display = "block";
	}

	var extensionConfig = {
		'wirelessTitle': $L("Wi-Fi Network"),
		'wirelessStateRow': row,
		'wirelessSSIDDisplay': display,
		'wirelessState': extensionPreferences.state,
		'wirelessSSID': extensionPreferences.ssid };
	
	return extensionConfig;
}

WirelessConfig.prototype.save = function(extensionConfig) {
	var extensionPreferences = {
		'state': extensionConfig.wirelessState,
		'ssid': extensionConfig.wirelessSSID };
	
	return extensionPreferences;
}

//

WirelessConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "wirelessState") {
		changeEvent.model.wirelessStateRow = "single";
		changeEvent.model.wirelessSSIDDisplay = "none";

		if(changeEvent.value >= 2) {
			changeEvent.model.wirelessStateRow = "first";
			changeEvent.model.wirelessSSIDDisplay = "block";
		}

		var state = this.controller.get('mojo-scene-mode-scene-scroller').mojo.getState();

		this.controller.get("TriggersList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-mode-scene-scroller').mojo.setState(state);
	}
}

