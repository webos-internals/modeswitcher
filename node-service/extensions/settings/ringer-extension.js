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
	
	var updateSettings = function(future, settingsOld, settingsNew, action) {
		if(action == 0) {
			var params = {};
			
			if((settingsNew.switchOn != undefined) && (settingsOld.switchOn != settingsNew.switchOn))
				params.VibrateWhenRingerOn = settingsNew.switchOn;
			
			if((settingsNew.switchOff != undefined) && (settingsOld.switchOff != settingsNew.switchOff))
				params.VibrateWhenRingerOff = settingsNew.switchOff;
			
			if((params.VibrateWhenRingerOn != undefined) || (params.VibrateWhenRingerOff != undefined)) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.soundsandalerts", 'service': "com.palm.audio/vibrate", 
					'method': "set", 'params': params}));
				
				future.then(this, function(future) { updateSettings(future, settingsOld, settingsNew, 1); });
			}
			else
				updateSettings(future, settingsOld, settingsNew, 1);
		}
		else if(action == 1) {
			var params = {};
			
			if((settingsNew.ringtonePath != undefined) && (settingsOld.ringtonePath != settingsNew.ringtonePath)) {
				params.ringtone = {
					'name': settingsNew.ringtoneName,
					'fullPath': settingsNew.ringtonePath};
			}
			
			if(params.ringtone != undefined) {
				future.nest(PalmCall.call("palm://com.palm.systemservice/", "setPreferences", params));
				
				future.then(this, function(future) { future.result = true; });
			}
			else
				future.result = true;
		}
	};
	
//
	
	that.update = function(settingsOld, settingsNew) {
		var future = new Future();
		
		future.now(this, function(future) {
			updateSettings(future, settingsOld, settingsNew, 0);
		});
		
		future.then(this, function(future) {
			future.result = { returnValue: true };
		});
		
		return future;
	};
	
	return that;
}());
