/*
	Security Configuration Object:
	
	lockMode: 				string,
	lockSecret: 			string,
	lockTimeout:			int
*/

var securitySettings = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var Future = Foundations.Control.Future;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
//
	
	var updateSecuritySettings = function(future, settingsOld, settingsNew) {
		var params = {};
	
		if((settingsNew.lockMode != undefined) && (settingsOld.lockMode != settingsNew.lockMode)) {
			if(settingsNew.lockMode == "none")
				params.lockMode = settingsNew.lockMode;
			else if((settingsNew.lockSecret != undefined) && (settingsNew.lockSecret.length > 0)) {
				params.lockMode = settingsNew.lockMode;
			
				params.passCode = settingsNew.lockSecret;
			}
		}
		else if((settingsNew.lockSecret != undefined) && (settingsNew.lockSecret.length > 0) &&
			(settingsOld.lockSecret != settingsNew.lockSecret))
		{
			if((settingsNew.lockMode != undefined) && (settingsNew.lockMode != "none")) {
				params.lockMode = settingsNew.lockMode;
		
				params.passCode = settingsNew.lockSecret;
			}
		}
	
		if(params.lockMode != undefined) {
			future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.app.screenandlock", 'service': "com.palm.systemmanager", 
				'method': "setDevicePasscode", 'params': params}));
		
			future.then(this, function(future) { future.result = 1; });
		}
		else
			future.result = 1; 
	};
	
	var updateTimeoutSettings = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.lockTimeout != undefined) && (settingsOld.lockTimeout != settingsNew.lockTimeout))
			params.lockTimeout = parseInt(settingsNew.lockTimeout);
		
		if(params.lockTimeout != undefined) {
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
					updateSecuritySettings(future, settingsOld, settingsNew);
				else if(future.result == 1)
					updateTimeoutSettings(future, settingsOld, settingsNew);
			});
		
		future.then(this, function(future) { future.result = true; });
				
		return future;
	};
	
	return that;
}());
