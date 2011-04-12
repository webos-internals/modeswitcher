function BluetoothConfig(controller, prefs) {
	this.controller = controller;

	this.prefs = prefs;
}

//

BluetoothConfig.prototype.label = function() {
	return $L("BT Connection Trigger");
}

//

BluetoothConfig.prototype.setup = function() {
	this.choicesProfileStateSelector = [
		{'label': $L("Connected"), 'value': 0},
		{'label': $L("Disconnected"), 'value': 1},
		{'label': $L("Connected to"), 'value': 2},
		{'label': $L("Disconnected from"), 'value': 3} ];
		
	this.controller.setupWidget("BluetoothStateSelector", {'label': $L("State"),
		'labelPlacement': "left", 'modelProperty': "bluetoothState",
		'choices': this.choicesProfileStateSelector});        

	this.choicesProfileSelector = [
		{'label': $L("Any Profile"), 'value': "any"},
		{'label': $L("Stereo Music"), 'value': "a2dp"},
		{'label': $L("AV Remote Control"), 'value': "avrcp"},
		{'label': $L("Hands-Free"), 'value': "hfg"},
		{'label': $L("Headset"), 'value': "hsp"},
		{'label': $L("Personal Area Network"), 'value': "pan"},
		{'label': $L("Phone Book Access"), 'value': "pba"} ];

	this.controller.setupWidget("BluetoothProfileSelector", {'label': $L("Profile"),
		'labelPlacement': "left", 'modelProperty': "bluetoothProfile",
		'choices': this.choicesProfileSelector});        

	this.controller.setupWidget("BluetoothDeviceText", {'hintText': $L("Bluetooth Device Name"), 
		'multiline': false, 'enterSubmits': false, 'focus': true, 
		'textCase': Mojo.Widget.steModeLowerCase, 'modelProperty': "bluetoothDevice"}); 

	// Listen for state selector change event

	this.controller.listen(this.controller.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

BluetoothConfig.prototype.config = function() {
	var extensionConfig = {
		'bluetoothTitle': $L("BT Connection"),
		'bluetoothState': 0,
		'bluetoothProfile': "any",
		'bluetoothDevice': "",
		'bluetoothProfileRow': "last",
		'bluetoothDeviceDisplay': "none" };
	
	return extensionConfig;
}

//

BluetoothConfig.prototype.load = function(extensionPreferences) {
	var row = "last";
	var display = "none";

	if(extensionPreferences.state >= 2) {
		row = "";
		display = "block";
	}

	var extensionConfig = {
		'bluetoothTitle': $L("BT Connection"),
		'bluetoothState': extensionPreferences.state,
		'bluetoothProfile': extensionPreferences.profile,
		'bluetoothDevice': extensionPreferences.device,
		'bluetoothProfileRow': row,
		'bluetoothDeviceDisplay': display };
	
	return extensionConfig;
}

BluetoothConfig.prototype.save = function(extensionConfig) {
	var extensionPreferences = {
		'state': extensionConfig.bluetoothState,
		'profile': extensionConfig.bluetoothProfile,
		'device': extensionConfig.bluetoothDevice };
	
	return extensionPreferences;
}

//

BluetoothConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "bluetoothState") {
		if(changeEvent.value >= 2) {
			changeEvent.model.bluetoothProfileRow = "";			
			changeEvent.model.bluetoothDeviceDisplay = "block";
		}
		else {
			changeEvent.model.bluetoothProfileRow = "last";			
			changeEvent.model.bluetoothDeviceDisplay = "none";
		}
		
		var state = this.controller.get('mojo-scene-mode-scene-scroller').mojo.getState();

		this.controller.get("TriggersList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-mode-scene-scroller').mojo.setState(state);
	}
}

