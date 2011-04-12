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
	
	var settingsUpdate = function(future, settingsOld, settingsNew, item, next, newFuture) {
		if(newFuture)
			future = newFuture;

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

		utils.asyncForEach(configCalls, 
			settingsUpdate.bind(this, future, settingsOld, settingsNew), 
			function(future) { future.result = { returnValue: true }; });
		
		return future;
	};

	return that;
}());

