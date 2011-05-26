/*
	Airplane Configuration Object:
	
	flightMode: 			boolean
*/

var airplaneSettings = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var Future = Foundations.Control.Future;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
	var configCalls = ["airplane"];
	
//
	
	var settingsUpdate = function(settingsOld, settingsNew, item, next, future) {
		if(item == "airplane") {
			var params = {};
			
			if((settingsNew.flightMode != undefined) && (settingsOld.flightMode != settingsNew.flightMode))
				params.airplaneMode = settingsNew.flightMode;
			
			if(params.airplaneMode != undefined) {
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
		
		utils.futureLoop(future, configCalls, settingsUpdate.bind(this, settingsOld, settingsNew), 
			function(future) { future.result = { returnValue: true }; }.bind(this));
		
		return future;
	};
	
	return that;
}());
