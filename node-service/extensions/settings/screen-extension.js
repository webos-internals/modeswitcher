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

	var configCalls = ["display", "screen"];

//
	
	var settingsUpdate = function(future, settingsOld, settingsNew, item, next, newFuture) {
		if(newFuture)
			future = newFuture;

		if(item == "display") {
			var params = {};

			if((settingsNew.brightnessLevel != undefined) && (settingsOld.brightnessLevel != settingsNew.brightnessLevel))
				params.maximumBrightness = settingsNew.brightnessLevel;

			if((settingsNew.turnOffTimeout != undefined) && (settingsOld.turnOffTimeout != settingsNew.turnOffTimeout))
				params.timeout = settingsNew.turnOffTimeout;
			
			if((params.maximumBrightness != undefined) || (params.timeout != undefined)) {
				future.nest(PalmCall.call("palm://org.webosinternals.impersonate/", "systemCall", {
					'id': "com.palm.app.screenandlock", 'service': "com.palm.display/control", 
					'method': "setProperty", 'params': params}));
			
				future.then(this, function(future) { next(future); });
			}
			else
				next(future);
		}
		else if(item == "screen") {
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
			
				future.then(this, function(future) { next(future); });
			}
			else
				next(future);
		}
	}
	
//
	
	that.update = function(settingsOld, settingsNew) {
		var future = new Future();

		utils.asyncForEach(configCalls, 
			settingsUpdate.bind(this, future, settingsOld, settingsNew), 
			function(future) {future.result = { returnValue: true };});
		
		return future;
	};

	return that;
}());

