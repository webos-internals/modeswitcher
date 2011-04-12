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

	var configCalls = ["security", "timeout"];

//
	
	var settingsUpdate = function(future, settingsOld, settingsNew, item, next, newFuture) {
		if(newFuture)
			future = newFuture;

		if(item == "security") {
			var params = {};

			if((settingsNew.lockMode != undefined) && (settingsOld.lockMode != settingsNew.lockMode))
				params.lockMode = settingsNew.lockMode;

			if((settingsNew.lockSecret != undefined) && (settingsOld.lockSecret != settingsNew.lockSecret)) {
				if(settingsNew.lockMode)
					params.lockMode = settingsNew.lockMode;
				
				params.passCode = settingsNew.lockSecret;
			}
			
			if(params.lockMode != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.impersonate/", "systemCall", {
					'id': "com.palm.app.screenandlock", 'service': "com.palm.systemmanager", 
					'method': "setDevicePasscode", 'params': params}));
			
				future.then(this, function(future) { next(future); });
			}
			else
				next(future);
		}
		else if(item == "timeout") {
			var params = {};

			if((settingsNew.lockTimeout != undefined) && (settingsOld.lockTimeout != settingsNew.lockTimeout))
				params.lockTimeout = settingsNew.lockTimeout;

			if(params.lockTimeout != undefined) {
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

