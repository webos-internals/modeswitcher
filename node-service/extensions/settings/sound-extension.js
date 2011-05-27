/*
	Sound Configuration Object:
	
	ringerVolume: 				integer,
	systemVolume: 				integer,
	mediaVolume: 				integer
*/

var soundSettings = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var Future = Foundations.Control.Future;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
//
	
	var updateRingerVolume = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.ringerVolume != undefined) && (settingsOld.ringerVolume != settingsNew.ringerVolume))
			params.volume = parseInt(settingsNew.ringerVolume);
		
		if(params.volume != undefined) {
			future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.app.soundsandalerts", 'service': "com.palm.audio/ringtone", 
				'method': "setVolume", 'params': params}));
			
			future.then(this, function(future) { future.result = 1; });
		}
		else
			future.result = 1; 
	};
	
	var updateSystemVolume = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.systemVolume != undefined) && (settingsOld.systemVolume != settingsNew.systemVolume))
			params.volume = parseInt(settingsNew.systemVolume);
		
		if(params.volume != undefined) {
			future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.app.soundsandalerts", 'service': "com.palm.audio/system", 
				'method': "setVolume", 'params': params}));
			
			future.then(this, function(future) { future.result = 2; });
		}
		else
			future.result = 2; 
	};
	
	var updateMediaVolume = function(future, settingsOld, settingsNew, audioScenario) {
		var result = future.result;
	
		var params = {'scenario': audioScenario};
		
		if((settingsNew.mediaVolume != undefined) && (settingsOld.mediaVolume != settingsNew.mediaVolume))
			params.volume = parseInt(settingsNew.mediaVolume);
		
		if(params.volume != undefined) {
			future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.app.soundsandalerts", 'service': "com.palm.audio/media", 
				'method': "setVolume", 'params': params}));
			
			future.then(this, function(future) { future.result = result + 1; });
		}
		else
			future.result = 6; 
	};
	
//
	
	that.update = function(settingsOld, settingsNew) {
		var future = new Future(0);
		
		future.whilst(this, function(future) { return future.result < 6; },
			function(future) {
				if(future.result == 0)
					updateRingerVolume(future, settingsOld, settingsNew);
				else if(future.result == 1)
					updateSystemVolume(future, settingsOld, settingsNew);
				else if(future.result == 2)
					updateMediaVolume(future, settingsOld, settingsNew, "media_back_speaker");
				else if(future.result == 3)
					updateMediaVolume(future, settingsOld, settingsNew, "media_front_speaker");
				else if(future.result == 4)
					updateMediaVolume(future, settingsOld, settingsNew, "media_headset");
				else if(future.result == 5)
					updateMediaVolume(future, settingsOld, settingsNew, "media_headset_mic");
			});
		
		future.then(this, function(future) { future.result = true; });
				
		return future;
	};
	
	return that;
}());
