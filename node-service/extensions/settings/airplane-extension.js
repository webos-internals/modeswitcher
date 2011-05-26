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
	
	var settingsUpdate = function(settingsOld, settingsNew, item) {
		var future = new Future();
		
		if(item == "airplane") {
			var params = {};
		
			if((settingsNew.flightMode != undefined) && (settingsOld.flightMode != settingsNew.flightMode))
				params.airplaneMode = settingsNew.flightMode;
		
			if(params.airplaneMode != undefined) {
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
		
		future.nest(utils.futureLoop(["airplane"], 
			settingsUpdate.bind(this, settingsOld, settingsNew)));
		
		future.then(this, function(future) { 
			future.result = { returnValue: true }; 
		});
		
		return future;
	};
	
	return that;
}());
