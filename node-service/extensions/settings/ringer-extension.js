/*
	Ringer Configuration Object:
	
	switchOn: 			boolean,
	switchOff: 			boolean,
	ringtoneName:	 	string,
	ringtonePath: 		string
*/

var ringerSettings = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var Future = Foundations.Control.Future;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
//
	
	var updateRingerSettings = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.switchOn != undefined) && (settingsOld.switchOn != settingsNew.switchOn))
			params.VibrateWhenRingerOn = settingsNew.switchOn;
		
		if((settingsNew.switchOff != undefined) && (settingsOld.switchOff != settingsNew.switchOff))
			params.VibrateWhenRingerOff = settingsNew.switchOff;
		
		if((params.VibrateWhenRingerOn != undefined) || (params.VibrateWhenRingerOff != undefined)) {
			future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.app.soundsandalerts", 'service': "com.palm.audio/vibrate", 
				'method': "set", 'params': params}));
			
			future.then(this, function(future) { future.result = 1; });
		}
		else
			future.result = 1; 
	};
	
	var updateRingtoneSettings = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.ringtonePath != undefined) && (settingsOld.ringtonePath != settingsNew.ringtonePath)) {
			params.ringtone = {
				'name': settingsNew.ringtoneName,
				'fullPath': settingsNew.ringtonePath};
		}
		
		if(params.ringtone != undefined) {
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
					updateRingerSettings(future, settingsOld, settingsNew);
				else if(future.result == 1)
					updateRingtoneSettings(future, settingsOld, settingsNew);
			});
		
		future.then(this, function(future) { future.result = true; });
				
		return future;
	};
	
	return that;
}());
