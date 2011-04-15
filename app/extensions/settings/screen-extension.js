function ScreenConfig(controller, prefs) {
	this.controller = controller;
	
	this.prefs = prefs;
}

//

ScreenConfig.prototype.label = function() {
	return $L("Screen Settings");
}

//

ScreenConfig.prototype.setup = function(defaultChoiseLabel) {
	// Screen brightness slider, timeout and wallpaper selector

	this.choicesScreenSelector = [
		{'label': defaultChoiseLabel, 'value': -1},
		{'label': $L("Minimum"), 'value': 0},
		{'label': $L("Maximum"), 'value': 100} ];  

	this.controller.setupWidget("ScreenBrightnessSelector", {'label': $L("Brightness"), 
		'labelPlacement': "left", 'modelProperty': "screenBrightnessLevel",
		'choices': this.choicesScreenSelector});
		
	this.controller.setupWidget("ScreenBrightnessSlider", {'minValue': -1, 'maxValue': 100, 
		'round': true, 'modelProperty': "screenBrightnessLevel"});

	if(this.prefs.advancedPrefs) {
		this.choicesTimeoutSelector = [
			{'label': defaultChoiseLabel, 'value': -1},
			{'label': "15 " + $L("Seconds"), 'value': 15},
			{'label': "30 " + $L("Seconds"), 'value': 30},
			{'label': "1 " + $L("Minute"), 'value': 60},
			{'label': "2 " + $L("Minutes"), 'value': 120},
			{'label': "3 " + $L("Minutes"), 'value': 180},
			{'label': "5 " + $L("Minutes"), 'value': 300},
			{'label': $L("Never"), 'value': 10800} ];  
	}
	else {
		this.choicesTimeoutSelector = [
			{'label': defaultChoiseLabel, 'value': -1},
			{'label': "30 " + $L("Seconds"), 'value': 30},
			{'label': "1 " + $L("Minute"), 'value': 60},
			{'label': "2 " + $L("Minutes"), 'value': 120},
			{'label': "3 " + $L("Minutes"), 'value': 180} ];  
	}
		
	this.controller.setupWidget("ScreenTimeoutSelector",	{'label': $L("Turn Off After"), 
		'labelPlacement': "left", 'modelProperty': "screenTurnOffTimeout",
		'choices': this.choicesTimeoutSelector});

	this.choicesBlinkSelector = [
		{'label': defaultChoiseLabel, 'value': -1},		
		{'label': $L("Enabled"), 'value': 1},
		{'label': $L("Disabled"), 'value': 0} ];  

	this.controller.setupWidget("ScreenBlinkSelector", {'label': $L("Blink Notify"), 
		'labelPlacement': "left", 'modelProperty': "screenBlinkNotify",
		'choices': this.choicesBlinkSelector});

	this.choicesLockedSelector = [
		{'label': defaultChoiseLabel, 'value': -1},		
		{'label': $L("Enabled"), 'value': 1},
		{'label': $L("Disabled"), 'value': 0} ];  

	this.controller.setupWidget("ScreenLockedSelector", {'label': $L("Locked Notify"), 
		'labelPlacement': "left", 'modelProperty': "screenLockedNotify",
		'choices': this.choicesBlinkSelector});

	this.choicesWallpaperSelector = [
		{'label': defaultChoiseLabel, 'value': ""},
		{'label': $L("Select"), 'value': "select"} ];  

	this.controller.setupWidget("ScreenWallpaperSelector", {'label': $L("Wallpaper"), 
		'labelPlacement': "left", 'modelProperty': "screenWallpaperName",
		'choices': this.choicesWallpaperSelector});

	this.controller.listen(this.controller.get("SettingsList"), Mojo.Event.listTap, 
		this.helpItemTapped.bind(this));
			
	// Listen for tap event for wallpaper selector
	
	this.controller.listen(this.controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this));
}

//

ScreenConfig.prototype.config = function() {
	var extensionConfig = {
		'screenTitle': $L("Screen"),
		'screenBrightnessLevel': -1, 
		'screenTurnOffTimeout': -1, 
		'screenBlinkNotify': -1, 
		'screenLockedNotify': -1, 
		'screenWallpaperName': "", 
		'screenWallpaperPath': "" };
	
	return extensionConfig;
}

//

ScreenConfig.prototype.fetch = function(doneCallback) {
	var extensionConfig = this.config();
	
	this.getSystemSettings(0, extensionConfig, doneCallback);
}

//

ScreenConfig.prototype.load = function(extensionPreferences) {
	var extensionConfig = this.config();
	
	if(extensionPreferences.brightnessLevel != undefined)
		extensionConfig.screenBrightnessLevel = extensionPreferences.brightnessLevel;

	if(extensionPreferences.turnOffTimeout != undefined)
		extensionConfig.screenTurnOffTimeout = extensionPreferences.turnOffTimeout;

	if(extensionPreferences.blinkNotify != undefined)
		extensionConfig.screenBlinkNotify = extensionPreferences.blinkNotify;

	if(extensionPreferences.lockedNotify != undefined)
		extensionConfig.screenLockedNotify = extensionPreferences.lockedNotify; 

	if(extensionPreferences.wallpaperPath != undefined) {
		extensionConfig.screenWallpaperName = extensionPreferences.wallpaperName;
		extensionConfig.screenWallpaperPath = extensionPreferences.wallpaperPath;
	}
	
	return extensionConfig;
}

ScreenConfig.prototype.save = function(extensionConfig) {
	var extensionPreferences = {};

	if(extensionConfig.screenBrightnessLevel != -1)
		extensionPreferences.brightnessLevel = extensionConfig.screenBrightnessLevel;

	if(extensionConfig.screenTurnOffTimeout != -1)
		extensionPreferences.turnOffTimeout = extensionConfig.screenTurnOffTimeout;
	
	if(extensionConfig.screenBlinkNotify != -1)
		extensionPreferences.blinkNotify = extensionConfig.screenBlinkNotify;
		
	if(extensionConfig.screenLockedNotify != -1)
		extensionPreferences.lockedNotify = extensionConfig.screenLockedNotify;
			
	if(extensionConfig.screenWallpaperPath.length != 0) {
		extensionPreferences.wallpaperName = extensionConfig.screenWallpaperName;
		extensionPreferences.wallpaperPath = extensionConfig.screenWallpaperPath;
	}
	
	return extensionPreferences;
}

//

ScreenConfig.prototype.helpItemTapped = function(event) {
	if(event.originalEvent.target.id == "ScreenBrightnessHelp") {
		var helpTitle = "Brightness";

		var helpText = "Screen brightness setting. Sets the brightness level for the display.";
	}
	else if(event.originalEvent.target.id == "ScreenTimeoutHelp") {
		var helpTitle = "Turn Off After";

		var helpText = "Screen timeout setting. Idle timeout for the screen to turn off.";
	}
	else if(event.originalEvent.target.id == "ScreenBlinkHelp") {
		var helpTitle = "Blink Notify";

		var helpText = "Blink notification setting. Global control for blink notifications.";
	}
	else if(event.originalEvent.target.id == "ScreenLockedHelp") {
		var helpTitle = "Locked Notify";

		var helpText = "Locked notifications setting. When enabled, notifications are shown on the lock screen.";
	}
	else if(event.originalEvent.target.id == "ScreenWallpaperHelp") {
		var helpTitle = "Wallpaper";

		var helpText = "Screen wallpaper setting. Wallpaper image to set as screen background.";
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

ScreenConfig.prototype.handleListChange = function(changeEvent) {
	if(changeEvent.property == "screenWallpaperName") {
		changeEvent.model.screenWallpaperName = "";
		changeEvent.model.screenWallpaperPath = "";		
		
		this.controller.modelChanged(changeEvent.model, this);

		if(changeEvent.value == "select") {
			this.executeWallpaperSelect(changeEvent.model);
		}
	}	
}

//

ScreenConfig.prototype.executeWallpaperSelect = function(eventModel) {
	Mojo.FilePicker.pickFile({'defaultKind': "image", 'kinds': ["image"], 'actionType': "open", 
		'actionName': $L("Select Wallpaper"), 'crop': {'width': 318, 'height': 479}, 'onSelect': 
			function(eventModel, serviceResponse) {
				if((!serviceResponse) || (!serviceResponse.fullPath)) {
					eventModel.screenWallpaperName = "";
					eventModel.screenWallpaperPath = "";

					this.controller.modelChanged(eventModel, this);
					
					return;
				}
	
				var params = {'target': encodeURIComponent(serviceResponse.fullPath)};
	
				if(serviceResponse.cropInfo.window) {
					if(serviceResponse.cropInfo.window.scale)
						params['scale'] = serviceResponse.cropInfo.window.scale;
		
					if(serviceResponse.cropInfo.window.focusX)
						params['focusX'] = serviceResponse.cropInfo.window.focusX;
		
					if(serviceResponse.cropInfo.window.focusY)
						params['focusY'] = serviceResponse.cropInfo.window.focusY;
				}			
		
				this.controller.serviceRequest("palm://com.palm.systemservice/wallpaper/", {
					'method': "importWallpaper", 
					'parameters': params,
					'onSuccess': function(eventModel, serviceResponse) {
						if(serviceResponse.wallpaper) {
							eventModel.screenWallpaperName = serviceResponse.wallpaper.wallpaperName;
							eventModel.screenWallpaperPath = serviceResponse.wallpaper.wallpaperFile;
						}
						else {
							eventModel.screenWallpaperName = "";
							eventModel.screenWallpaperPath = "";
						}
						
						this.controller.modelChanged(eventModel, this);
					}.bind(this, eventModel),
					'onFailure': function(serviceResponse) {
						eventModel.screenWallpaperName = "";
						eventModel.screenWallpaperPath = "";

						this.controller.modelChanged(eventModel, this);			
					}.bind(this, eventModel)});
			}.bind(this, eventModel)},
		this.controller.stageController);
}

//

ScreenConfig.prototype.getSystemSettings = function(requestID, extensionConfig, doneCallback) {
	var requestCallback = this.handleGetResponse.bind(this, requestID, extensionConfig, doneCallback);
	
	if(requestID == 0) {
		this.controller.serviceRequest("palm://org.webosinternals.impersonate/", {'method': "systemCall",
			'parameters': {
				'id': "com.palm.app.screenlock", 'service': "com.palm.display/control", 
				'method': "getProperty", 'params': {'properties': ["maximumBrightness", "timeout"]}},
			'onComplete': requestCallback});				
	}
	else if(requestID == 1) {
		this.controller.serviceRequest("palm://com.palm.systemservice/", {'method': "getPreferences", 
			'parameters': {'keys': ["BlinkNotifications", "showAlertsWhenLocked", "wallpaper"]}, 
			'onComplete': requestCallback});
	}
	else
		doneCallback(extensionConfig);
}

ScreenConfig.prototype.handleGetResponse = function(requestID, extensionConfig, doneCallback, serviceResponse) {
	if(serviceResponse.returnValue) {
		if(requestID == 0) {
			extensionConfig.screenBrightnessLevel = serviceResponse.maximumBrightness;
			extensionConfig.screenTurnOffTimeout = serviceResponse.timeout;
		}
		else if(requestID == 1) {
			extensionConfig.screenBlinkNotify = serviceResponse.BlinkNotifications;

			extensionConfig.screenLockedNotify = serviceResponse.showAlertsWhenLocked;

			if(serviceResponse.wallpaper.wallpaperName.length != 0) {
				extensionConfig.screenWallpaperName = serviceResponse.wallpaper.wallpaperName;
				extensionConfig.screenWallpaperPath = serviceResponse.wallpaper.wallpaperFile;
			}
		}
	}

	this.getSystemSettings(++requestID, extensionConfig, doneCallback);
}

