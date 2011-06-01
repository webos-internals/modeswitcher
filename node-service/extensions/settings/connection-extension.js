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
	
	var updateSettings = function(future, settingsOld, settingsNew, action) {
		if(action == 0) {
			var params = {};
			
			if((settingsNew.dataState != undefined) && (settingsOld.dataState != settingsNew.dataState))
				params.disablewan = settingsNew.dataState;
			
			if(params.disablewan != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.phone", 'service': "com.palm.wan", 
					'method': "set", 'params': params}));
				
				future.then(this, function(future) { updateSettings(future, settingsOld, settingsNew, 1); });
			}
			else
				updateSettings(future, settingsOld, settingsNew, 1);
		}
		else if(action == 1) {
			var params = {};
			
			if((settingsNew.wifiState != undefined) && (settingsOld.wifiState != settingsNew.wifiState))
				params.state = settingsNew.wifiState;
			
			if(params.state != undefined) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.wifi", 'service': "com.palm.wifi", 
					'method': "setstate", 'params': params}));
				
				future.then(this, function(future) { updateSettings(future, settingsOld, settingsNew, 2); });
			}
			else
				updateSettings(future, settingsOld, settingsNew, 2);
		}
		else if(action == 2) {
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
				
				future.then(this, function(future) { updateSettings(future, settingsOld, settingsNew, 3); });
			}
			else
				updateSettings(future, settingsOld, settingsNew, 3);
		}
		else if(action == 3) {
			var params = {};
			
			if((settingsNew.gpsState != undefined) && (settingsOld.gpsState != settingsNew.gpsState))
				params.useGps = settingsNew.gpsState;
			
			if(params.useGps != undefined) {
				future.nest(PalmCall.call("palm://com.palm.location/", "setUseGps", params));
				
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
