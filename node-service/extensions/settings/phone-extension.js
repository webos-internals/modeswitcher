/*
	Phone Configuration Object:
	
	rejectAction:			string,
	rejectTemplate:		string,
	blinkNotify:			boolean
*/

var phoneSettings = (function() {
	var that = {};

	var Foundations = IMPORTS.foundations;

	var Future = Foundations.Control.Future;

	var PalmCall = Foundations.Comms.PalmCall;

	var configCalls = ["phone-get", "phone-set"];

//
	
	var settingsUpdate = function(future, settingsOld, settingsNew, item, next, newFuture) {
		if(newFuture)
			future = newFuture;

		if(item == "phone-get") {
			if((settingsNew.blinkNotify == undefined) && 
				(settingsNew.rejectAction == undefined) && (settingsNew.rejectTemplate == undefined))
			{
				next(future);
			}
			else {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.phone", 'service': "com.palm.systemservice", 
					'method': "getPreferences", 'params': {'keys': ["callRejection", "callNotification"]}}));

				future.then(this, function(settingsNew, future) {
					if(settingsNew.blinkNotify != undefined) {
						settingsNew.repeatInterval = 0;
						settingsNew.repeatLimit = 3;
				
						if(future.result.callNotification) {
							settingsNew.repeatInterval = future.result.callNotification.repeatInterval;
							settingsNew.repeatLimit = future.result.callNotification.repeatLimit;
						}
					}
				
					if((settingsNew.rejectAction != undefined) || (settingsNew.rejectTemplate != undefined)) {
						if(settingsNew.rejectAction == undefined) {
							settingsNew.rejectAction = "none";
					
							if(future.result.callRejection)
								settingsNew.rejectAction = future.result.callRejection.rejectAction;
						}

						if(settingsNew.rejectTemplate == undefined) {
							settingsNew.rejectTemplate = "Sorry, I am currently busy and will call you back later...";

							if(future.result.rejectTemplate)
								settingsNew.rejectTemplate = future.result.callRejection.rejectTemplate;
						}
					}
							
					next(future);
				}.bind(this, settingsNew));
			}
		}
		else if(item == "phone-set") {
			var params = {};

			if(((settingsNew.rejectAction != undefined) && (settingsOld.rejectAction != settingsNew.rejectAction)) ||
				((settingsNew.rejectTemplate != undefined) && (settingsOld.rejectTemplate != settingsNew.rejectTemplate)))
			{
				params.callRejection = {
					rejectAction: settingsNew.rejectAction,
					rejectTemplate: settingsNew.rejectTemplate };
			}

			if((settingsNew.blinkNotify != undefined) && (settingsOld.blinkNotify != settingsNew.blinkNotify)) {
				params.callNotification = {
					notificationBlink: settingsNew.blinkNotify,
					repeatInterval: settingsNew.repeatInterval,
					repeatLimit: settingsNew.repeatLimit };
			}
						
			if((params.callRejection != undefined) || (params.callNotification != undefined))
			{
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.phone", 'service': "com.palm.systemservice", 
					'method': "setPreferences", 'params': params}));

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

