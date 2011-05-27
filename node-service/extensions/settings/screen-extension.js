/*
	Screen Configuration Object:
	
	brightnessLevel:		integer,
	turnOffTimeout:		integer,
	blinkNotify: 			boolean,
	lockedNotify: 			boolean,
	wallpaperName: 		string,
	wallpaperPath: 		string
*/

var screenSettings = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var Future = Foundations.Control.Future;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
//
	
	var updateDisplaySettings = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.brightnessLevel != undefined) && (settingsOld.brightnessLevel != settingsNew.brightnessLevel))
			params.maximumBrightness = parseInt(settingsNew.brightnessLevel);
		
		if((settingsNew.turnOffTimeout != undefined) && (settingsOld.turnOffTimeout != settingsNew.turnOffTimeout))
			params.timeout = parseInt(settingsNew.turnOffTimeout);
		
		if((params.maximumBrightness != undefined) || (params.timeout != undefined)) {
			future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.app.screenandlock", 'service': "com.palm.display/control", 
				'method': "setProperty", 'params': params}));
			
			future.then(this, function(future) { future.result = 1; });
		}
		else
			future.result = 1;
	};
	
	var updateScreenSettings = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.blinkNotify != undefined) && (settingsOld.blinkNotify != settingsNew.blinkNotify))
			params.BlinkNotifications = settingsNew.blinkNotify;
		
		if((settingsNew.lockedNotify != undefined) && (settingsOld.lockedNotify != settingsNew.lockedNotify))
			params.showAlertsWhenLocked = settingsNew.lockedNotify;
		
		if((settingsNew.wallpaperPath != undefined) && (settingsOld.wallpaperPath != settingsNew.wallpaperPath)) {
			params.wallpaper = {
				'wallpaperName': settingsNew.wallpaperName,
				'wallpaperFile': settingsNew.wallpaperPath };
		}
		
		if((params.BlinkNotifications != undefined) || (params.showAlertsWhenLocked != undefined) ||
			(params.wallpaper != undefined))
		{
			future.nest(PalmCall.call("palm://com.palm.systemservice/", "setPreferences", params));
			
			future.then(this, function(future) { future.result = 2; });
		}
		else
			future.result = 2; 
	};
	
//
	
	that.update = function(settingsOld, settingsNew) {
		var future = new Future(0);
		
		future.whilst(this, function(future) { return future.result < 2; },
			function(future) {
				if(future.result == 0)
					updateDisplaySettings(future, settingsOld, settingsNew);
				else if(future.result == 1)
					updateScreenSettings(future, settingsOld, settingsNew);
			});
		
		future.then(this, function(future) { future.result = true; });
				
		return future;
	};
	
	return that;
}());
