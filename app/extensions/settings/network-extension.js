function NetworkConfig(controller, prefs) {
	this.controller = controller;
	
	this.prefs = prefs;
}

//

NetworkConfig.prototype.label = function() {
	return $L("Network Settings");
}

//

NetworkConfig.prototype.setup = function(defaultChoiseLabel) {
	this.choicesNetworkTypeSelector = [
		{'label': defaultChoiseLabel, 'value': -1},
		{'label': $L("Automatic"), 'value': 1},
		{'label': $L("2G Only"), 'value': 2},
		{'label': $L("3G Only"), 'value': 3} ];  

	this.controller.setupWidget("NetworkTypeSelector", {'label': $L("Network Type"), 
		'labelPlacement': "left", 'modelProperty': "networkType",
		'choices': this.choicesNetworkTypeSelector});

	this.choicesDataRoamingSelector = [
		{'label': defaultChoiseLabel, 'value': -1},
		{'label': $L("Enabled"), 'value': 1},
		{'label': $L("Disabled"), 'value': 0} ];  

	this.controller.setupWidget("NetworkDataSelector", {'label': $L("Data Roaming"), 
		'labelPlacement': "left", 'modelProperty': "networkData",
		'choices': this.choicesDataRoamingSelector});

	this.choicesVoiceRoamingSelector = [
		{'label': defaultChoiseLabel, 'value': -1},
		{'label': $L("Automatic"), 'value': 1},
		{'label': $L("Home Only"), 'value': 2},
		{'label': $L("Roam Only"), 'value': 3} ];  

	this.controller.setupWidget("NetworkVoiceSelector", {'label': $L("Voice Roaming"), 
		'labelPlacement': "left", 'modelProperty': "networkVoice", 
		"disabledProperty": "disabledVoice",
		'choices': this.choicesVoiceRoamingSelector});
}

//

NetworkConfig.prototype.config = function() {
	var extensionConfig = {
		'networkTitle': $L("Network"),
		'networkType': -1, 
		'networkData': -1, 
		'networkVoice': -1,
		'disabledVoice': true };
	
	return extensionConfig;
}

//

NetworkConfig.prototype.fetch = function(doneCallback) {
	var extensionConfig = this.config();

	this.getSystemSettings(0, extensionConfig, doneCallback);
}

//

NetworkConfig.prototype.load = function(extensionPreferences) {
	var extensionConfig = this.config();
	
	extensionConfig.disabledVoice = extensionPreferences.voiceDisabled;
	
	if(extensionPreferences.networkType != undefined) {
		if(extensionPreferences.networkType == "gsm")
			extensionConfig.networkType = 2;
		else if(extensionPreferences.networkType == "umts")
			extensionConfig.networkType = 3;
		else
			extensionConfig.networkType = 1;
	}
	
	if(extensionPreferences.dataRoaming != undefined) {
		if(extensionPreferences.dataRoaming == "enable")
			extensionConfig.networkData = 0;
		else
			extensionConfig.networkData = 1;
	}
	
	if(extensionPreferences.voiceRoaming != undefined) {
		if(extensionPreferences.voiceRoaming == "homeonly")
			extensionConfig.networkVoice = 2;
		else if(extensionPreferences.voiceRoaming == "roamonly")
			extensionConfig.networkVoice = 3;
		else
			extensionConfig.networkVoice = 1;
	}
	
	return extensionConfig;
}

NetworkConfig.prototype.save = function(extensionConfig) {
	var extensionPreferences = {};
	
	extensionPreferences.voiceDisabled = extensionConfig.disabledVoice;
	
	if(extensionConfig.networkType != -1) {
		if(extensionConfig.networkType == 2)
			extensionPreferences.networkType = "gsm";
		else if(extensionConfig.networkType == 3)
			extensionPreferences.networkType = "umts";
		else
			extensionPreferences.networkType = "automatic";
	}
	
	if(extensionConfig.networkData != -1) {
		if(extensionConfig.networkData == 0)
			extensionPreferences.dataRoaming = "enable";
		else
			extensionPreferences.dataRoaming = "disable";
	}
	
	if(extensionConfig.networkVoice != -1) {
		if(extensionConfig.networkVoice == 2)
			extensionPreferences.voiceRoaming = "homeonly";
		else if(extensionConfig.networkVoice == 3)
			extensionPreferences.voiceRoaming = "roamonly";
		else
			extensionPreferences.voiceRoaming = "any";
	}
	
	return extensionPreferences;
}

//

NetworkConfig.prototype.getSystemSettings = function(requestID, extensionConfig, doneCallback) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, extensionConfig, doneCallback);

	if(requestID == 0) {
		this.controller.serviceRequest("palm://org.webosinternals.impersonate/", {'method': "systemCall",
			'parameters': {
				'id': "com.palm.app.phoneprefs", 'service': "com.palm.telephony", 
				'method': "ratQuery", 'params': {}}, 
			'onFailure': requestCallback, 'onSuccess': requestCallback});		
	}
	else if(requestID == 1) {
		this.controller.serviceRequest("palm://org.webosinternals.impersonate/", {'method': "systemCall",
			'parameters': {
				'id': "com.palm.app.phone", 'service': "com.palm.preferences/appProperties", 
				'method': "Get", 'params': {'appId': "com.palm.wan", 'key': "roamguard"}}, 
			'onComplete': requestCallback});
	}
	else if(requestID == 2) {
		this.controller.serviceRequest("palm://org.webosinternals.impersonate/", {'method': "systemCall",
			'parameters': {
				'id': "com.palm.app.phoneprefs", 'service': "com.palm.telephony", 
				'method': "roamModeQuery", 'params': {}}, 
			'onFailure': requestCallback, 'onSuccess': requestCallback});	
	}
	else
		doneCallback(extensionConfig);
}

NetworkConfig.prototype.handleGetResponse = function(requestID, extensionConfig, doneCallback, serviceResponse) {
	if(serviceResponse.returnValue) {
		if(requestID == 0) {
			if(serviceResponse.extended.mode == "gsm")
				extensionConfig.networkType = 2;
			else if(serviceResponse.extended.mode == "umts")
				extensionConfig.networkType = 3;
			else
				extensionConfig.networkType = 1;
		}
		else if(requestID == 1) {
			if(serviceResponse.roamguard.roamguard == "neverblock")
				extensionConfig.networkData = 1;
			else
				extensionConfig.networkData = 0;
		}
		else if(requestID == 2) {
			extensionConfig.disabledVoice = false;
		
			if(serviceResponse.extended) {
				if(serviceResponse.extended.mode == "homeonly")
					extensionConfig.networkVoice = 2;
				else if(serviceResponse.extended.mode == "roamonly")
					extensionConfig.networkVoice = 3;
				else
					extensionConfig.networkVoice = 1;
			}
		}		
	}

// FIXME: onFailure on voice roaming call gets called twice, bug in impersonate?

	if(this.lastRequestID != requestID) {
		this.lastRequestID = requestID;
		this.getSystemSettings(++requestID, extensionConfig, doneCallback);
	}
}

