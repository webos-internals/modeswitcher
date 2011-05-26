/*
	Connection Configuration Object:
	
	phoneState:		 			string,
	dataState: 					string,
	wifiState: 					string,
	btState:		 				boolean,
	gpsState: 					boolean
*/

var connectionSettings = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var Future = Foundations.Control.Future;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
//
	
	var settingsUpdate = function(settingsOld, settingsNew, item) {
		var future = new Future();
		
		if(item == "telephony") {
			var params = {};
			
			if((settingsNew.phoneState != undefined) && (settingsOld.phoneState != settingsNew.phoneState))
				params.state = settingsNew.phoneState;
			
			if(params.state != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.phone", 'service': "com.palm.telephony", 
					'method': "powerSet", 'params': params}));
				
				future.then(this, function(future) { future.result = { returnValue: true }; });
			}
			else
				future.result = { returnValue: true }; 
		}
		else if(item == "wan") {
			var params = {};
			
			if((settingsNew.dataState != undefined) && (settingsOld.dataState != settingsNew.dataState))
				params.disablewan = settingsNew.dataState;
			
			if(params.disablewan != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.phone", 'service': "com.palm.wan", 
					'method': "set", 'params': params}));
				
				future.then(this, function(future) { future.result = { returnValue: true }; });
			}
			else
				future.result = { returnValue: true }; 
		}
		else if(item == "wifi") {
			var params = {};
			
			if((settingsNew.wifiState != undefined) && (settingsOld.wifiState != settingsNew.wifiState))
				params.state = settingsNew.wifiState;
			
			if(params.state != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.wifi", 'service': "com.palm.wifi", 
					'method': "setstate", 'params': params}));
				
				future.then(this, function(future) { future.result = { returnValue: true }; });
			}
			else
				future.result = { returnValue: true }; 
		}
		else if(item == "btmonitor") {
			var params = {};
			
			if((settingsNew.btState != undefined) && (settingsOld.btState != settingsNew.btState)) {
				params.connectable = settingsNew.btState;
				params.visible = settingsNew.btState;
				
				if(settingsNew.btState)
					var method = "radioon";
				else
					var method = "radiooff";
			}
			
			if(params.connectable != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.wifi", 'service': "com.palm.btmonitor/monitor", 
					'method': method, 'params': params}));
				
				future.then(this, function(future) { future.result = { returnValue: true }; });
			}
			else
				future.result = { returnValue: true }; 
		}
		else if(item == "location") {
			var params = {};
			
			if((settingsNew.gpsState != undefined) && (settingsOld.gpsState != settingsNew.gpsState))
				params.useGps = settingsNew.gpsState;
			
			if(params.useGps != undefined) {
				future.nest(PalmCall.call("palm://com.palm.location/", "setUseGps", params));
				
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
		
		future.nest(utils.futureLoop(["telephony", "wan", 
				"wifi", "btmonitor", "location"], 
			settingsUpdate.bind(this, settingsOld, settingsNew)));
		
		future.then(this, function(future) { 
			future.result = { returnValue: true }; 
		});
				
		return future;
	};
	
	return that;
}());
