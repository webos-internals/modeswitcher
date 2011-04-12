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

	var configCalls = ["audio", "system"];

//
	
	var settingsUpdate = function(future, settingsOld, settingsNew, item, next, newFuture) {
		if(newFuture)
			future = newFuture;

		if(item == "audio") {
			var params = {};

			if((settingsNew.switchOn != undefined) && (settingsOld.switchOn != settingsNew.switchOn))
				params.VibrateWhenRingerOn = settingsNew.switchOn;

			if((settingsNew.switchOff != undefined) && (settingsOld.switchOff != settingsNew.switchOff))
				params.VibrateWhenRingerOff = settingsNew.switchOff;
			
			if((params.VibrateWhenRingerOn != undefined) || (params.VibrateWhenRingerOff != undefined)) {
				future.nest(PalmCall.call("palm://org.webosinternals.impersonate/", "systemCall", {
					'id': "com.palm.app.soundsandalerts", 'service': "com.palm.audio/vibrate", 
					'method': "set", 'params': params}));
			
				future.then(this, function(future) { next(future); });
			}
			else
				next(future);
		}
		else if(item == "system") {
			var params = {};

			if((settingsNew.ringtonePath != undefined) && (settingsOld.ringtonePath != settingsNew.ringtonePath)) {
				params.ringtone = {
					'name': settingsNew.ringtoneName,
					'fullPath': settingsNew.ringtonePath};
			}

			if(params.ringtone != undefined) {
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

