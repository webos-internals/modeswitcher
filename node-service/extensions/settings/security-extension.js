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
	
	var updateSettings = function(future, settingsOld, settingsNew, action) {
		if(action == 0) {
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
				
				future.then(this, function(future) { updateSettings(future, settingsOld, settingsNew, 1); });
			}
			else
				updateSettings(future, settingsOld, settingsNew, 1);
		}
		else if(action == 1) {
			var params = {};
			
			if((settingsNew.lockTimeout != undefined) && (settingsOld.lockTimeout != settingsNew.lockTimeout))
				params.lockTimeout = parseInt(settingsNew.lockTimeout);
			
			if(params.lockTimeout != undefined) {
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
