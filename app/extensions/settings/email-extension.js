function EmailConfig(controller, prefs) {
	this.controller = controller;
	
	this.prefs = prefs;
	
	this.accountSelectorChoices = [
		{'label': $L("No email accounts"), 'value': -1} ];
}

//

EmailConfig.prototype.label = function() {
	if(this.prefs.advancedPrefs)
		return $L("Email Settings");
}

//

EmailConfig.prototype.setup = function(defaultChoiseLabel) {
	this.choicesEmailAccountSelector = this.accountSelectorChoices;

	this.controller.setupWidget("EmailAccountSelector", { 
		'labelPlacement': "right", 'modelProperty': "emailAccountId",
		'choices': this.choicesEmailAccountSelector});

	this.choicesEmailBlinkSelector = [
		{'label': defaultChoiseLabel, 'value': -1},
		{'label': $L("Enabled"), 'value': 1},
		{'label': $L("Disabled"), 'value': 0} ];  

	this.controller.setupWidget("EmailBlinkSelector", {'label': $L("Blink"), 
		'labelPlacement': "left", 'modelProperty': "emailBlinkNotify",
		'choices': this.choicesEmailBlinkSelector});

	this.choicesEmailAlertSelector = [
		{'label': defaultChoiseLabel, 'value': -1},
		{'label': $L("System Sound"), 'value': 1},
		{'label': $L("Ringtone"), 'value': 2},
		{'label': $L("Vibrate"), 'value': 3},
		{'label': $L("Mute"), 'value': 0} ];  

	this.controller.setupWidget("EmailAlertSelector", {'label': $L("Alert"), 
		'labelPlacement': "left", 'modelProperty': "emailNotifyAlert",
		'choices': this.choicesEmailAlertSelector});

	this.choicesEmailRingtoneSelector = [
		{'label': defaultChoiseLabel, 'value': ""},
		{'label': $L("Select"), 'value': "select"} ];  

	this.controller.setupWidget("EmailRingtoneSelector", {'label': $L("Ringtone"), 
		'labelPlacement': "left", 'modelProperty': "emailRingtoneName",
		'choices': this.choicesEmailRingtoneSelector});

	this.choicesEmailSyncSelector = [
		{'label': defaultChoiseLabel, 'value': -1},
		{'label': $L("As Items Arrive"), 'value': 1000000}, 
		{'label': "5 " + $L("Minutes"), 'value': 5},
		{'label': "10 " + $L("Minutes"), 'value': 10},
		{'label': "15 " + $L("Minutes"), 'value': 15},
		{'label': "30 " + $L("Minutes"), 'value': 30},
		{'label': "1 " + $L("Hour"), 'value': 60},
		{'label': "6 " + $L("Hours"), 'value': 360},		
		{'label': "12 " + $L("Hours"), 'value': 720},
		{'label': "24 " + $L("Hours"), 'value': 1440},		
		{'label': $L("Manual"), 'value': 0} ];

	this.controller.setupWidget("EmailSyncSelector", {'label': $L("Get Email"), 
		'labelPlacement': "left", 'modelProperty': "emailSyncInterval",
		'choices': this.choicesEmailSyncSelector});

	// Listen for change event for ringtone selector
	
	this.controller.listen(this.controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

EmailConfig.prototype.config = function() {
	var extensionConfig = {
		'emailTitle': $L("Email"),
		'emailAccountRow': "single",
		'emailBlinkDisplay': "none",
		'emailAlertDisplay': "none", 		
		'emailRingtoneDisplay': "none", 
		'emailSyncDisplay': "none", 
		'emailCurrentId': -1,
		'emailAccountId': -1,
		'emailBlinkNotify': -1, 
		'emailNotifyAlert': -1, 
		'emailRingtoneName': -1, 
		'emailRingtonePath': -1,
		'emailSyncInterval': -1,
		'emailAccounts': {},		
		'emailAccountsCfg': [],
		'emailBlinkNotifyCfg': {}, 
		'emailNotifyAlertCfg': {}, 
		'emailRingtoneNameCfg': {}, 
		'emailRingtonePathCfg': {},
		'emailSyncIntervalCfg': {} };
	
	return extensionConfig;
}

//

EmailConfig.prototype.fetch = function(doneCallback) {
	var extensionConfig = this.config();
	
	this.getSystemSettings(0, extensionConfig, doneCallback);
}

//

EmailConfig.prototype.load = function(extensionPreferences) {
	var extensionConfig = this.config();

	if(extensionPreferences.accounts != undefined) {
		extensionConfig.emailAccountsCfg = extensionPreferences.accounts;

		this.accountSelectorChoices.clear();
	
		for(var i = 0; i < extensionPreferences.accounts.length; i++) {
			var accId = extensionPreferences.accounts[i].accountId;
		
			if(i == 0) {
				extensionConfig.emailAccountId = accId;
				extensionConfig.emailCurrentId = accId;				
			}

			extensionConfig.emailBlinkNotifyCfg[accId] = -1;
			extensionConfig.emailNotifyAlertCfg[accId] = -1;
			extensionConfig.emailRingtoneNameCfg[accId] = "";
			extensionConfig.emailRingtonePathCfg[accId] = "";
			extensionConfig.emailSyncIntervalCfg[accId] = -1;
									
			if(extensionPreferences.blinkNotify[accId] != undefined) {
				if(extensionPreferences.blinkNotify[accId])
					extensionConfig.emailBlinkNotifyCfg[accId] = 1;
				else
					extensionConfig.emailBlinkNotifyCfg[accId] = 0;
			}

			if(extensionPreferences.notifyAlert[accId] != undefined) {
				if(extensionPreferences.notifyAlert[accId] == "system")
					extensionConfig.emailNotifyAlertCfg[accId] = 1;
				else if(extensionPreferences.notifyAlert[accId] == "ringtone")
					extensionConfig.emailNotifyAlertCfg[accId] = 2;
				else if(extensionPreferences.notifyAlert[accId] == "vibrate")
					extensionConfig.emailNotifyAlertCfg[accId] = 3;
				else
					extensionConfig.emailNotifyAlertCfg[accId] = 0;
			}
			
			if(extensionPreferences.ringtoneName[accId] != undefined)
				extensionConfig.emailRingtoneNameCfg[accId] = extensionPreferences.ringtoneName[accId];

			if(extensionPreferences.ringtonePath[accId] != undefined)
				extensionConfig.emailRingtonePathCfg[accId] = extensionPreferences.ringtonePath[accId];

			if(extensionPreferences.syncInterval[accId] != undefined) {
				if(extensionPreferences.syncInterval[accId] == -1)
					extensionConfig.emailSyncIntervalCfg[accId] = 1000000;
				else
					extensionConfig.emailSyncIntervalCfg[accId] = extensionPreferences.syncInterval[accId];
			}
			
			this.accountSelectorChoices.push({
				'label': extensionPreferences.accounts[i].identifier, 
				'value': extensionPreferences.accounts[i].accountId });
		}

		extensionConfig.emailBlinkNotify = extensionConfig.emailBlinkNotifyCfg[extensionConfig.emailCurrentId];
		extensionConfig.emailNotifyAlert = extensionConfig.emailNotifyAlertCfg[extensionConfig.emailCurrentId];
		extensionConfig.emailRingtoneName = extensionConfig.emailRingtoneNameCfg[extensionConfig.emailCurrentId];		
		extensionConfig.emailRingtonePath = extensionConfig.emailRingtonePathCfg[extensionConfig.emailCurrentId];
		extensionConfig.emailSyncInterval = extensionConfig.emailSyncIntervalCfg[extensionConfig.emailCurrentId];

		extensionConfig.emailAccountRow = "first";				
		extensionConfig.emailBlinkDisplay = "block";
		extensionConfig.emailSyncDisplay = "block";

		extensionConfig.emailAlertDisplay = "none";
		extensionConfig.emailRingtoneDisplay = "none";
		
		extensionConfig.emailAlertDisplay = "block";				

		if((extensionConfig.emailNotifyAlert == -1) || (extensionConfig.emailNotifyAlert == 2))
			extensionConfig.emailRingtoneDisplay = "block";	
	}
	
	return extensionConfig;
}

EmailConfig.prototype.save = function(extensionConfig) {
	var extensionPreferences = {};
	
	if(extensionConfig.emailAccountsCfg.length > 0) {
		extensionConfig.emailBlinkNotifyCfg[extensionConfig.emailCurrentId] = extensionConfig.emailBlinkNotify;
		extensionConfig.emailNotifyAlertCfg[extensionConfig.emailCurrentId] = extensionConfig.emailNotifyAlert;
		extensionConfig.emailRingtoneNameCfg[extensionConfig.emailCurrentId] = extensionConfig.emailRingtoneName;
		extensionConfig.emailRingtonePathCfg[extensionConfig.emailCurrentId] = extensionConfig.emailRingtonePath;
		extensionConfig.emailSyncIntervalCfg[extensionConfig.emailCurrentId] = extensionConfig.emailSyncInterval;

		extensionPreferences.accounts = extensionConfig.emailAccountsCfg;

		extensionPreferences.blinkNotify = {};
		extensionPreferences.notifyAlert = {};
		extensionPreferences.ringtoneName = {};
		extensionPreferences.ringtonePath = {};
		extensionPreferences.syncInterval = {};

		for(var i = 0; i < extensionConfig.emailAccountsCfg.length; i++) {
			var accId = extensionConfig.emailAccountsCfg[i].accountId;

			if(extensionConfig.emailBlinkNotifyCfg[accId] != -1) {
				if(extensionConfig.emailBlinkNotifyCfg[accId] == 1)
					extensionPreferences.blinkNotify[accId] = true;
				else
					extensionPreferences.blinkNotify[accId] = false;
			}
			
			if(extensionConfig.emailNotifyAlertCfg[accId] != -1) {
				if(extensionConfig.emailNotifyAlertCfg[accId] == 1)
					extensionPreferences.notifyAlert[accId] = "system";
				else if(extensionConfig.emailNotifyAlertCfg[accId] == 2)
					extensionPreferences.notifyAlert[accId] = "ringtone";
				else if(extensionConfig.emailNotifyAlertCfg[accId] == 3)
					extensionPreferences.notifyAlert[accId] = "vibrate";
				else
					extensionPreferences.notifyAlert[accId] = "mute";
			}
				
			if(extensionConfig.emailRingtoneNameCfg[accId] != "")
				extensionPreferences.ringtoneName[accId] = extensionConfig.emailRingtoneNameCfg[accId];

			if(extensionConfig.emailRingtonePathCfg[accId] != "")
				extensionPreferences.ringtonePath[accId] = extensionConfig.emailRingtonePathCfg[accId];

			if(extensionConfig.emailSyncIntervalCfg[accId] != -1) {
				if(extensionConfig.emailSyncIntervalCfg[accId] == 1000000)
					extensionPreferences.syncInterval[accId] = -1;
				else
					extensionPreferences.syncInterval[accId] = extensionConfig.emailSyncIntervalCfg[accId];
			}
		}
	}
	
	return extensionPreferences;
}

//

EmailConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "emailAccountId") {
		changeEvent.model.emailBlinkNotify = changeEvent.model.emailBlinkNotifyCfg[changeEvent.value];
		changeEvent.model.emailNotifyAlert = changeEvent.model.emailNotifyAlertCfg[changeEvent.value];
		changeEvent.model.emailRingtoneName = changeEvent.model.emailRingtoneNameCfg[changeEvent.value];
		changeEvent.model.emailRingtonePath = changeEvent.model.emailRingtonePathCfg[changeEvent.value];
		changeEvent.model.emailSyncInterval = changeEvent.model.emailSyncIntervalCfg[changeEvent.value];
		
		changeEvent.model.emailRingtoneDisplay = "none";

		if((changeEvent.model.emailNotifyAlert == -1) || (changeEvent.model.emailNotifyAlert == 2))
			changeEvent.model.emailRingtoneDisplay = "block";	
		
		changeEvent.model.emailCurrentId = changeEvent.model.emailAccountId;

		var state = this.controller.get('mojo-scene-mode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-mode-scene-scroller').mojo.setState(state);
	}
	else if(changeEvent.property == "emailNotifyAlert") {
		changeEvent.model.emailRingtoneDisplay = "none";
		
		if((changeEvent.value == -1) || (changeEvent.value == 2))
			changeEvent.model.emailRingtoneDisplay = "block";
		
		var state = this.controller.get('mojo-scene-mode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-mode-scene-scroller').mojo.setState(state);
	}
	else if(changeEvent.property == "emailRingtoneName") {
		changeEvent.model.emailRingtoneName = "";		
		changeEvent.model.emailRingtonePath = "";		
	
		if(changeEvent.value == "select") {
			this.executeRingtoneSelect(changeEvent.model);
		}
		
		this.controller.modelChanged(changeEvent.model, this);
	}
}

//

EmailConfig.prototype.executeRingtoneSelect = function(eventModel) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': $L("Done"), 'onSelect': 
			function(eventModel, serviceResponse) {
				eventModel.emailRingtoneName = serviceResponse.name;
				eventModel.emailRingtonePath = serviceResponse.fullPath;
				
				this.controller.modelChanged(eventModel, this);
			}.bind(this, eventModel)},
		this.controller.stageController);
}

//

EmailConfig.prototype.getSystemSettings = function(requestID, extensionConfig, doneCallback) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, extensionConfig, doneCallback);
	
	if(requestID == 0) {
		this.controller.serviceRequest("palm://org.webosinternals.impersonate/", {'method': "systemCall",
			'parameters': {
				'id': "com.palm.app.email", 'service': "com.palm.db", 
				'method': "find", 'params': {'query': {'from': "com.palm.account:1"}}}, 
			'onComplete': requestCallback});	
	}
	else if(requestID == 1) {
		this.controller.serviceRequest("palm://org.webosinternals.impersonate/", {'method': "systemCall",
			'parameters': {
				'id': "com.palm.app.email", 'service': "com.palm.db", 
				'method': "find", 'params': {'query': {'from': "com.palm.mail.account:1"}}}, 
			'onComplete': requestCallback});	
	}
	else
		doneCallback(extensionConfig);
}

EmailConfig.prototype.handleGetResponse = function(requestID, extensionConfig, doneCallback, serviceResponse) {
	if(serviceResponse.returnValue) {
		if(requestID == 0) {
			for(var i = 0; i < serviceResponse.results.length; i++) {
				for(var j = 0; j < serviceResponse.results[i].capabilityProviders.length; j++) {
					if(serviceResponse.results[i].capabilityProviders[j].capability == "MAIL")
						extensionConfig.emailAccounts[serviceResponse.results[i]._id] = serviceResponse.results[i].alias;
				}
			}			
		}
		else if(requestID == 1) {
			for(var i = 0; i < serviceResponse.results.length; i++) {
				var accId = serviceResponse.results[i].accountId;

				extensionConfig.emailBlinkNotifyCfg[accId] = 0;
				extensionConfig.emailNotifyAlertCfg[accId] = 0;
				extensionConfig.emailRingtoneNameCfg[accId] = "";
				extensionConfig.emailRingtonePathCfg[accId] = "";
				extensionConfig.emailSyncIntervalCfg[accId] = 15;								
				
				if((serviceResponse.results[i].notifications) && (serviceResponse.results[i].notifications.blink))
					extensionConfig.emailBlinkNotifyCfg[accId] = true;
				
				if((serviceResponse.results[i].notifications) && (serviceResponse.results[i].notifications.type)){
					if(serviceResponse.results[i].notifications.type == "system")
						extensionConfig.emailNotifyAlertCfg[accId] = 1;
					else if(serviceResponse.results[i].notifications.type == "ringtone") {
						extensionConfig.emailNotifyAlertCfg[accId] = 2;

						if((serviceResponse.results[i].notifications.ringtonePath) &&
							(serviceResponse.results[i].notifications.ringtonePath.length > 0))
						{
							extensionConfig.emailRingtoneNameCfg[accId] = serviceResponse.results[i].notifications.ringtoneName;
							extensionConfig.emailRingtonePathCfg[accId] = serviceResponse.results[i].notifications.ringtonePath;												
						}
					}
					else if(serviceResponse.results[i].notifications.type == "vibrate")
						extensionConfig.emailNotifyAlertCfg[accId] = 3;					
				}
				
				if(serviceResponse.results[i].syncFrequencyMins == -1)
					extensionConfig.emailSyncIntervalCfg[accId] = 1000000;
				else
					extensionConfig.emailSyncIntervalCfg[accId] = serviceResponse.results[i].syncFrequencyMins;

				if(i == 0) {
					extensionConfig.emailAccountsCfg.clear();
					
					extensionConfig.emailAccountId = accId;
					extensionConfig.emailCurrentId = accId;

					this.accountSelectorChoices.clear();

					extensionConfig.emailAccountRow = "first";				
					extensionConfig.emailBlinkDisplay = "block";
					extensionConfig.emailSyncDisplay = "block";
										
					extensionConfig.emailBlinkNotify = extensionConfig.emailBlinkNotifyCfg[accId];
					extensionConfig.emailNotifyAlert = extensionConfig.emailNotifyAlertCfg[accId];					
					extensionConfig.emailRingtoneName = extensionConfig.emailRingtoneNameCfg[accId];					
					extensionConfig.emailRingtonePath = extensionConfig.emailRingtonePathCfg[accId];					
					extensionConfig.emailSyncInterval = extensionConfig.emailSyncIntervalCfg[accId];					
					
					extensionConfig.emailAlertDisplay = "block";				

					if((extensionConfig.emailNotifyAlert == -1) || (extensionConfig.emailNotifyAlert == 2))
						extensionConfig.emailRingtoneDisplay = "block";
				}

				extensionConfig.emailAccountsCfg.push({
					'id': serviceResponse.results[i]._id,
					'accountId': serviceResponse.results[i].accountId,
					'identifier': extensionConfig.emailAccounts[accId] + " - " + serviceResponse.results[i].username });
				
				this.accountSelectorChoices.push({
					'label': extensionConfig.emailAccounts[accId] + " - " + serviceResponse.results[i].username, 
					'value': serviceResponse.results[i].accountId });
			}
		}
	}

	this.getSystemSettings(++requestID, extensionConfig, doneCallback);
}

