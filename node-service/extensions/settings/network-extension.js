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
	
//
	
	var updateNetworkSettings = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.networkType != undefined) && (settingsOld.networkType != settingsNew.networkType))
			params.mode = settingsNew.networkType;
		
		if(params.mode != undefined) {
			future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.app.phone", 'service': "com.palm.telephony", 
				'method': "ratSet", 'params': params}));
			
			future.then(this, function(future) { future.result = 1; });
		}
		else
			future.result = 1; 
	};
	
	var updateRoamingSettings = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.dataRoaming != undefined) && (settingsOld.dataRoaming != settingsNew.dataRoaming))
			params.roamguard = settingsNew.dataRoaming;
		
		if(params.roamguard != undefined) {
			future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.app.phone", 'service': "com.palm.wan", 
				'method': "set", 'params': params}));
			
			future.then(this, function(future) { future.result = 2; });
		}
		else
			future.result = 2; 
	};
	
	var updateTelephoneSettings = function(future, settingsOld, settingsNew) {
		var params = {'client': "ModeSwitcher"};
	
		if((settingsNew.voiceRoaming != undefined) && (settingsOld.voiceRoaming != settingsNew.voiceRoaming))
			params.mode = settingsNew.voiceRoaming;
	
		if(params.mode != undefined) {
			future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.app.phone", 'service': "com.palm.telephony", 
				'method': "roamModeSet", 'params': params}));
		
			future.then(this, function(future) { future.result = 3; });
		}
		else
			future.result = 3; 
	};
	
//
	
	that.update = function(settingsOld, settingsNew) {
		var future = new Future(0);
		
		future.whilst(this, function(future) { return future.result < 3; },
			function(future) {
				if(future.result == 0)
					updateNetworkSettings(future, settingsOld, settingsNew);
				else if(future.result == 1)
					updateRoamingSettings(future, settingsOld, settingsNew);
				else if(future.result == 2)
					updateTelephoneSettings(future, settingsOld, settingsNew);
			});
		
		future.then(this, function(future) { future.result = true; });
				
		return future;
	};
	
	return that;
}());
