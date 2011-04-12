function CalendarConfig(controller, prefs) {
	this.controller = controller;
	
	this.prefs = prefs;
}

//

CalendarConfig.prototype.label = function() {
	if(this.prefs.advancedPrefs)
		return $L("Calendar Settings");
}

//

CalendarConfig.prototype.setup = function(defaultChoiseLabel) {
	this.choicesCalendarBlinkSelector = [
		{'label': defaultChoiseLabel, 'value': -1},
		{'label': $L("Enabled"), 'value': 1},
		{'label': $L("Disabled"), 'value': 0} ];  

	this.controller.setupWidget("CalendarBlinkSelector", {'label': $L("Blink"),	
		'labelPlacement': "left", 'modelProperty': "calendarBlinkNotify", 
		'choices': this.choicesCalendarBlinkSelector});

	this.choicesCalendarAlarmSelector = [
		{'label': defaultChoiseLabel, 'value': -1},
		{'label': $L("System Sound"), 'value': 1},
		{'label': $L("Ringtone"), 'value': 2},
		{'label': $L("Vibrate"), 'value': 3},
		{'label': $L("Mute"), 'value': 0} ];  

	this.controller.setupWidget("CalendarAlarmSelector", {'label': $L("Reminder"),	
		'labelPlacement': "left", 'modelProperty': "calendarReminderAlert", 
		'choices': this.choicesCalendarAlarmSelector});

	this.choicesCalendarRingtoneSelector = [
		{'label': defaultChoiseLabel, 'value': ""},
		{'label': $L("Select"), 'value': "select"} ];  

	this.controller.setupWidget("CalendarRingtoneSelector", {'label': $L("Ringtone"), 
		'labelPlacement': "left", 'modelProperty': "calendarRingtoneName",
		'choices': this.choicesCalendarRingtoneSelector});

	// Listen for change event for ringtone selector
	
	this.controller.listen(this.controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this) );
}

//

CalendarConfig.prototype.config = function() {
	var extensionConfig = {
		'calendarTitle': $L("Calendar"),
		'calendarAlarmRow': "last",
		'calendarRingtoneDisplay': "none",
		'calendarDatabaseId': 0,
		'calendarReminderAlert': -1,
		'calendarRingtoneName': "", 
		'calendarRingtonePath': "",
		'calendarBlinkNotify': -1};
	
	return extensionConfig;
}

//

CalendarConfig.prototype.fetch = function(doneCallback) {
	var extensionConfig = this.config();
	
	this.getSystemSettings(0, extensionConfig, doneCallback);
}

//

CalendarConfig.prototype.load = function(extensionPreferences) {
	var extensionConfig = this.config();
	
	extensionConfig.calendarDatabaseId = extensionPreferences.databaseId;
	
	if(extensionPreferences.reminderAlert != undefined)
		extensionConfig.calendarReminderAlert = extensionPreferences.reminderAlert;

	if((extensionConfig.calendarReminderAlert == -1) || 
		(extensionConfig.calendarReminderAlert == 2))
	{
		extensionConfig.calendarAlarmRow = "";
		extensionConfig.calendarRingtoneDisplay = "block";
	}

	if(extensionPreferences.ringtonePath != undefined) {
		extensionConfig.calendarRingtoneName = extensionPreferences.ringtoneName;
		extensionConfig.calendarRingtonePath = extensionPreferences.ringtonePath;
	}

	if(extensionPreferences.blinkNotify != undefined) {
		if(extensionPreferences.blinkNotify)
			extensionConfig.calendarBlinkNotify = 1;
		else
			extensionConfig.calendarBlinkNotify = 0;
	}
		
	return extensionConfig;
}

CalendarConfig.prototype.save = function(extensionConfig) {
	var extensionPreferences = {};
	
	extensionPreferences.databaseId = extensionConfig.calendarDatabaseId;
	
	if(extensionConfig.calendarReminderAlert != -1)
		extensionPreferences.reminderAlert = extensionConfig.calendarReminderAlert;
	
	if(extensionConfig.calendarReminderAlert == 2) {
		if((extensionConfig.calendarRingtoneName) && 	
			(extensionConfig.calendarRingtoneName.length > 0))
		{
			extensionPreferences.ringtoneName = extensionConfig.calendarRingtoneName;
			extensionPreferences.ringtonePath = extensionConfig.calendarRingtonePath;			
		}
	}
	
	if(extensionConfig.calendarBlinkNotify == 1)
		extensionPreferences.blinkNotify = true;
	else if(extensionConfig.calendarBlinkNotify == 0)		
		extensionPreferences.blinkNotify = false;	
	
	return extensionPreferences;
}

//

CalendarConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "calendarReminderAlert") {
		changeEvent.model.calendarAlarmRow = "last";
		changeEvent.model.calendarRingtoneDisplay = "none";
		
		if(changeEvent.value == 2) {
			changeEvent.model.calendarAlarmRow = "";			
			changeEvent.model.calendarRingtoneDisplay = "block";
		}
						
		var state = this.controller.get('mojo-scene-mode-scene-scroller').mojo.getState();

		this.controller.get("SettingsList").mojo.invalidateItems(0);
		
		this.controller.get('mojo-scene-mode-scene-scroller').mojo.setState(state);
	}
	else if(changeEvent.property == "calendarRingtoneName") {
		changeEvent.model.calendarRingtoneName = "";		
		changeEvent.model.calendarRingtonePath = "";		
		
		this.controller.modelChanged(changeEvent.model, this);

		if(changeEvent.value == "select") {
			this.executeRingtoneSelect(changeEvent.model);
		}
	}	
}

//

CalendarConfig.prototype.executeRingtoneSelect = function(eventModel) {
	Mojo.FilePicker.pickFile({'defaultKind': "ringtone", 'kinds': ["ringtone"], 
		'actionType': "attach", 'actionName': $L("Done"), 'onSelect': 
			function(eventModel, serviceResponse) {
				if(serviceResponse) {
					eventModel.calendarRingtoneName = serviceResponse.name;
					eventModel.calendarRingtonePath = serviceResponse.fullPath;
				
					this.controller.modelChanged(eventModel, this);	
				}
			}.bind(this, eventModel)},
		this.controller.stageController);
}

//

CalendarConfig.prototype.getSystemSettings = function(requestID, extensionConfig, doneCallback) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, extensionConfig, doneCallback);

	if(requestID == 0) {
		this.controller.serviceRequest("palm://org.webosinternals.impersonate/", {'method': "systemCall",
			'parameters': {
				'id': "com.palm.app.calendar", 'service': "com.palm.db", 
				'method': "find", 'params': {'query': {'from': "com.palm.calendarprefs:1"}}}, 
			'onComplete': requestCallback});
	}
	else
		doneCallback(extensionConfig);
}

CalendarConfig.prototype.handleGetResponse = function(requestID, extensionConfig, doneCallback, serviceResponse) {
	if(serviceResponse.errorCode != undefined)
		return;

	if(serviceResponse.returnValue) {
		if(requestID == 0) {
			if(serviceResponse.results.length > 0) {
				extensionConfig.calendarDatabaseId = serviceResponse.results[0]._id;
			
				extensionConfig.calendarReminderAlert = serviceResponse.results[0].alarmSoundOn;

				if(extensionConfig.calendarReminderAlert == 2) {
					extensionConfig.calendarRingtoneDisplay = "block";
				}
		
				if((serviceResponse.results[0].ringtonePath != undefined) && 
					(serviceResponse.results[0].ringtonePath.length > 0))
				{
					extensionConfig.calendarRingtoneName = serviceResponse.results[0].ringtoneName;
					extensionConfig.calendarRingtonePath = serviceResponse.results[0].ringtonePath;
				}

				extensionConfig.calendarBlinkNotify = 1;				

				if(serviceResponse.results[0].blinkNotification == false)
					extensionConfig.calendarBlinkNotify = 0;
			}
		}
	}
	
	this.getSystemSettings(++requestID, extensionConfig, doneCallback);
}

