function AirplaneConfig(controller, prefs) {
	this.controller = controller;
	
	this.prefs = prefs;
}

//

AirplaneConfig.prototype.label = function() {
	return $L("Airplane Settings");
}

//

AirplaneConfig.prototype.setup = function(defaultChoiseLabel) {
	this.choicesAirplaneModeSelector = [
		{'label': defaultChoiseLabel, 'value': -1},
		{'label': $L("Enabled"), 'value': 1},
		{'label': $L("Disabled"), 'value': 0} ];  

	this.controller.setupWidget("AirplaneModeSelector", {'label': $L("Flight Mode"),	
		'labelPlacement': "left", 'modelProperty': "airplaneFlightMode", 
		'choices': this.choicesAirplaneModeSelector});
}

//

AirplaneConfig.prototype.config = function() {
	var extensionConfig = {
		'airplaneTitle': $L("Airplane"),
		'airplaneFlightMode': -1 };
	
	return extensionConfig;
}

//

AirplaneConfig.prototype.fetch = function(doneCallback) {
	var extensionConfig = this.config();

	this.getSystemSettings(0, extensionConfig, doneCallback);
}

//

AirplaneConfig.prototype.load = function(extensionPreferences) {
	var extensionConfig = this.config();

	if(extensionPreferences.flightMode != undefined) {
		if(extensionPreferences.flightMode)
			extensionConfig.airplaneFlightMode = 1;
		else
			extensionConfig.airplaneFlightMode = 0;		
	}
	
	return extensionConfig;
}

AirplaneConfig.prototype.save = function(extensionConfig) {
	var extensionPreferences = {};
	
	if(extensionConfig.airplaneFlightMode != -1) {
		if(extensionConfig.airplaneFlightMode == 0)
			extensionPreferences.flightMode = false;
		else
			extensionPreferences.flightMode = true;
	}
	
	return extensionPreferences;
}

//

AirplaneConfig.prototype.getSystemSettings = function(requestID, extensionConfig, doneCallback) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, extensionConfig, doneCallback);
	
	if(requestID == 0) {
		this.controller.serviceRequest("palm://com.palm.systemservice/", {'method': "getPreferences", 
			'parameters': {'keys': ["airplaneMode"]}, 'onComplete': requestCallback});
	}
	else
		doneCallback(extensionConfig);
}

AirplaneConfig.prototype.handleGetResponse = function(requestID, extensionConfig, doneCallback, serviceResponse) {
	if(serviceResponse.returnValue) {	
		if(requestID == 0) {
			extensionConfig.airplaneFlightMode = serviceResponse.airplaneMode;
		}
	}
	
	this.getSystemSettings(++requestID, extensionConfig, doneCallback);
}

