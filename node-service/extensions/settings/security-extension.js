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
	
	var settingsUpdate = function(settingsOld, settingsNew, item) {
		var future = new Future();
		
		if(item == "security") {
			var params = {};
			
			if((settingsNew.lockMode != undefined) && (settingsOld.lockMode != settingsNew.lockMode)) {
				if((settingsNew.lockSecret != undefined) && (settingsNew.lockSecret.length > 0)) {
					params.lockMode = settingsNew.lockMode;
					
					params.passCode = settingsNew.lockSecret;
				}
			}
			else if((settingsNew.lockSecret != undefined) && (settingsOld.lockSecret != settingsNew.lockSecret)) {
				if((settingsNew.lockMode != undefined) && (settingsNew.lockMode != "none")) {
					params.lockMode = settingsNew.lockMode;
				
					params.passCode = settingsNew.lockSecret;
				}
			}
			
			if(params.lockMode != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.screenandlock", 'service': "com.palm.systemmanager", 
					'method': "setDevicePasscode", 'params': params}));
				
				future.then(this, function(future) { future.result = { returnValue: true }; });
			}
			else
				future.result = { returnValue: true }; 
		}
		else if(item == "timeout") {
			var params = {};
			
			if((settingsNew.lockTimeout != undefined) && (settingsOld.lockTimeout != settingsNew.lockTimeout))
				params.lockTimeout = parseInt(settingsNew.lockTimeout);
			
			if(params.lockTimeout != undefined) {
				future.nest(PalmCall.call("palm://com.palm.systemservice/", "setPreferences", params));
				
				future.then(this, function(future) { future.result = { returnValue: true }; });
			}
			else
				future.result = { returnValue: true }; 
		}
		
		return future;
	};
	
//
	
	that.update = function(settingsOld, settingsNew) {
		var future = new Future();
		
		future.nest(utils.futureLoop(["security", "timeout"], 
			settingsUpdate.bind(this, settingsOld, settingsNew)));
		
		future.then(this, function(future) { 
			future.result = { returnValue: true }; 
		});
				
		return future;
	};
	
	return that;
}());
