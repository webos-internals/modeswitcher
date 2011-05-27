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
	
	var updateTelephonySettings = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.phoneState != undefined) && (settingsOld.phoneState != settingsNew.phoneState))
			params.state = settingsNew.phoneState;
		
		if(params.state != undefined) {
			future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.app.phone", 'service': "com.palm.telephony", 
				'method': "powerSet", 'params': params}));
			
			future.then(this, function(future) { future.result = 1; });
		}
		else
			future.result = 1; 
	};
	
	var updateNetworkSettings = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.dataState != undefined) && (settingsOld.dataState != settingsNew.dataState))
			params.disablewan = settingsNew.dataState;
		
		if(params.disablewan != undefined) {
			future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.app.phone", 'service': "com.palm.wan", 
				'method': "set", 'params': params}));
			
			future.then(this, function(future) { future.result = 2; });
		}
		else
			future.result = 2; 
	};
	
	var updateWirelessSettings = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.wifiState != undefined) && (settingsOld.wifiState != settingsNew.wifiState))
			params.state = settingsNew.wifiState;
		
		if(params.state != undefined) {
			future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.app.wifi", 'service': "com.palm.wifi", 
				'method': "setstate", 'params': params}));
			
			future.then(this, function(future) { future.result = 3; });
		}
		else
			future.result = 3; 
	};
	
	var updateBluetoothSettings = function(future, settingsOld, settingsNew) {
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
			
			future.then(this, function(future) { future.result = 4; });
		}
		else
			future.result = 4; 
	};
	
	var updateLocationSettings = function(future, settingsOld, settingsNew) {
		var params = {};
		
		if((settingsNew.gpsState != undefined) && (settingsOld.gpsState != settingsNew.gpsState))
			params.useGps = settingsNew.gpsState;
		
		if(params.useGps != undefined) {
			future.nest(PalmCall.call("palm://com.palm.location/", "setUseGps", params));
			
			future.then(this, function(future) { future.result = 5; });
		}
		else
			future.result = 5; 
	};
	
//
	
	that.update = function(settingsOld, settingsNew) {
		var future = new Future(0);
		
		future.whilst(this, function(future) { return future.result < 5; },
			function(future) {
				if(future.result == 0)
					updateTelephonySettings(future, settingsOld, settingsNew);
				else if(future.result == 1)
					updateNetworkSettings(future, settingsOld, settingsNew);
				else if(future.result == 2)
					updateWirelessSettings(future, settingsOld, settingsNew);
				else if(future.result == 3)
					updateBluetoothSettings(future, settingsOld, settingsNew);
				else if(future.result == 4)
					updateLocationSettings(future, settingsOld, settingsNew);
			});
		
		future.then(this, function(future) { future.result = true; });
				
		return future;
	};
	
	return that;
}());
