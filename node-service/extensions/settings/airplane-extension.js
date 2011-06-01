/*
	Airplane Configuration Object:
	
	flightMode: 			boolean
*/

var airplaneSettings = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var Future = Foundations.Control.Future;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
//
	
	var updateSettings = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.flightMode != undefined) && (settingsOld.flightMode != settingsNew.flightMode))
			params.airplaneMode = settingsNew.flightMode;
		
		if(params.airplaneMode != undefined) {
			future.nest(PalmCall.call("palm://com.palm.systemservice/", "setPreferences", params));
			
			future.then(this, function(future) { future.result = true; });
		}
		else
			future.result = true;
	};
	
//
	
	that.update = function(settingsOld, settingsNew) {
		var future = new Future();
		
		future.now(this, function(future) {
			updateSettings(future, settingsOld, settingsNew);
		});
		
		future.then(this, function(future) {
			future.result = { returnValue: true };
		});
		
		return future;
	};
	
	return that;
}());
