/*
	Calendar Configuration Object:
	
	databaseId:				string,
	blinkNotify:			boolean,
	reminderAlert: 		integer,
	ringtoneName:			string,
	ringtonePath:			string
*/

var calendarSettings = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var Future = Foundations.Control.Future;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
	var configCalls = ["calendar"];
	
//
	
	var settingsUpdate = function(future, settingsOld, settingsNew, item, next) {
		if(item == "calendar") {
			var params = {};
			
			if(settingsNew.databaseId != undefined) {
				params._id = settingsNew.databaseId;
				
				if((settingsNew.blinkNotify != undefined) && (settingsOld.blinkNotify != settingsNew.blinkNotify))
					params.blinkNotification = settingsNew.blinkNotify;
				
				if((settingsNew.reminderAlert != undefined) && (settingsOld.reminderAlert != settingsNew.reminderAlert))
					params.alarmSoundOn = settingsNew.reminderAlert;
				
				if((settingsNew.ringtonePath != undefined) && (settingsOld.ringtonePath != settingsNew.ringtonePath)) {
					params.ringtoneName = settingsNew.ringtoneName;
					params.ringtonePath = settingsNew.ringtonePath;
				}
			}
			
			if((params.blinkNotification != undefined) || (params.alarmSoundOn != undefined) || 
				(params.ringtonePath != undefined))
			{
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.calendar", 'service': "com.palm.db", 
					'method': "merge", 'params': {'objects': [params]}}));
				
				future.then(this, function(future) { next(); });
			}
			else
				next();
		}
	}
	
//
	
	that.update = function(settingsOld, settingsNew) {
		var future = new Future();
		
		utils.asyncForEach(configCalls, 
			settingsUpdate.bind(this, future, settingsOld, settingsNew), 
			function(future) { future.result = { returnValue: true }; }.bind(this, future));
		
		return future;
	};
	
	return that;
}());
