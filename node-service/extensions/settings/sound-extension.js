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

	var configCalls = ["ringtone", "system", "media1", "media2", "media3", "media4"];

//
	
	var settingsUpdate = function(future, settingsOld, settingsNew, item, next, newFuture) {
		if(newFuture)
			future = newFuture;

		if(item == "ringtone") {
			var params = {};

			if((settingsNew.ringerVolume != undefined) && (settingsOld.ringerVolume != settingsNew.ringerVolume))
				params.volume = parseInt(settingsNew.ringerVolume);

			if(params.volume != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.soundsandalerts", 'service': "com.palm.audio/ringtone", 
					'method': "setVolume", 'params': params}));
			
				future.then(this, function(future) { next(future); });
			}
			else
				next(future);
		}
		else if(item == "system") {
			var params = {};

			if((settingsNew.systemVolume != undefined) && (settingsOld.systemVolume != settingsNew.systemVolume))
				params.volume = parseInt(settingsNew.systemVolume);

			if(params.volume != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.soundsandalerts", 'service': "com.palm.audio/system", 
					'method': "setVolume", 'params': params}));
			
				future.then(this, function(future) { next(future); });
			}
			else
				next(future);
		}
		else if((item == "media1") || (item == "media2") || (item == "media3") || (item == "media4")) {
			if(item == "media1")
				var params = {'scenario': "media_back_speaker"};
			else if(item == "media2")
				var params = {'scenario': "media_front_speaker"};
			else if(item == "media3")
				var params = {'scenario': "media_headset"};
			else if(item == "media4")
				var params = {'scenario': "media_headset_mic"};

			if((settingsNew.mediaVolume != undefined) && (settingsOld.mediaVolume != settingsNew.mediaVolume))
				params.volume = parseInt(settingsNew.mediaVolume);

			if(params.volume != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.soundsandalerts", 'service': "com.palm.audio/media", 
					'method': "setVolume", 'params': params}));
			
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

