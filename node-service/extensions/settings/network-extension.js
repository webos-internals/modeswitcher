/*
	Network Configuration Object:
	
	networkType: 			string,
	dataRoaming: 			string,
	voiceRoaming: 			string,
	voiceDisabled:			boolean
	
*/

var networkSettings = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var Future = Foundations.Control.Future;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
	var configCalls = ["telephony1", "wan", "telephony2"];
	
//
	
	var settingsUpdate = function(settingsOld, settingsNew, item, next, future) {
		if(item == "telephony1") {
			var params = {};
			
			if((settingsNew.networkType != undefined) && (settingsOld.networkType != settingsNew.networkType))
				params.mode = settingsNew.networkType;
			
			if(params.mode != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.phone", 'service': "com.palm.telephony", 
					'method': "ratSet", 'params': params}));
				
				future.then(this, function(future) { next(future); });
			}
			else
				next(future);
		}
		else if(item == "wan") {
			var params = {};
			
			if((settingsNew.dataRoaming != undefined) && (settingsOld.dataRoaming != settingsNew.dataRoaming))
				params.roamguard = settingsNew.dataRoaming;
			
			if(params.roamguard != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.phone", 'service': "com.palm.wan", 
					'method': "set", 'params': params}));
				
				future.then(this, function(future) { next(future); });
			}
			else
				next(future);
		}
		else if(item == "telephony2") {
			var params = {'client': "ModeSwitcher"};
			
			if((settingsNew.voiceRoaming != undefined) && (settingsOld.voiceRoaming != settingsNew.voiceRoaming))
				params.mode = settingsNew.voiceRoaming;
			
			if(params.mode != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.phone", 'service': "com.palm.telephony", 
					'method': "roamModeSet", 'params': params}));
				
				future.then(this, function(future) { next(future); });
			}
			else
				next(future);
		}
	}
	
//
	
	that.update = function(settingsOld, settingsNew) {
		var future = new Future();
		
		utils.futureLoop(future, configCalls, settingsUpdate.bind(this, settingsOld, settingsNew), 
			function(future) { future.result = { returnValue: true }; }.bind(this));
		
		return future;
	};
	
	return that;
}());
