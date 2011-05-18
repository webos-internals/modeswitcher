/*
	Email Configuration Object:
	
	accounts: 				[{
		id:						string,
		accountId:				string,
		identifier:				string 
								}],
	blinkNotify:			{
		'accountId':			boolean
								},
	notifyAlert:			{
		'accountId':			string
								},
	ringtoneName: 			{
		'accountId':			string
								},
	ringtonePath: 			{
		'accountId':			string
								},
	syncInterval:			{
		'accountId':			integer
								}
*/

var emailSettings = (function() {
	var that = {};

	var Foundations = IMPORTS.foundations;

	var Future = Foundations.Control.Future;

	var PalmCall = Foundations.Comms.PalmCall;

	var configCalls = ["email"];

//
	
	var settingsUpdate = function(future, settingsOld, settingsNew, item, next, newFuture) {
		if(newFuture)
			future = newFuture;
		
		if(item == "email") {
			if((settingsNew.accounts) && (settingsNew.accounts.length > 0)) {
				var objects = [];

				for(var i = 0; i < settingsNew.accounts.length; i++) {
					var params  = {_id: settingsNew.accounts[i].id, notifications: {}};
				
					var accId = settingsNew.accounts[i].accountId;
				
					if((settingsNew.blinkNotify[accId] != undefined) && ((!settingsOld.blinkNotify) ||
						(settingsOld.blinkNotify[accId] != settingsNew.blinkNotify[accId])))
					{
						params.notifications.blink = settingsNew.blinkNotify[accId];
					}

					if((settingsNew.notifyAlert[accId] != undefined) && ((!settingsOld.notifyAlert) ||
						(settingsOld.notifyAlert[accId] != settingsNew.notifyAlert[accId])))
					{
						params.notifications.type = settingsNew.notifyAlert[accId];
					}

					if((settingsNew.ringtonePath[accId] != undefined) && ((!settingsOld.ringtonePath) ||
						(settingsOld.ringtonePath[accId] != settingsNew.ringtonePath[accId])))
					{
						params.notifications.ringtoneName = settingsNew.ringtoneName[accId];
						params.notifications.ringtonePath = settingsNew.ringtonePath[accId];
					}

					if((settingsNew.syncInterval[accId] != undefined) && ((!settingsOld.syncInterval) ||
						(settingsOld.syncInterval[accId] != settingsNew.syncInterval[accId])))
					{
						params.syncFrequencyMins = parseInt(settingsNew.syncInterval[accId]);
					}
				
					if((params.notifications.blink != undefined) || (params.notifications.type != undefined) ||  
						(params.notifications.ringtonePath != undefined) || (params.syncFrequencyMins != undefined))
					{
						objects.push(params);
					}
				}

				if(objects.length > 0) {
					future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
						'id': "com.palm.app.email", 'service': "com.palm.db", 
						'method': "merge", 'params': {'objects': objects}}));

					future.then(this, function(future) { next(future); });
				}
				else
					next(future);
			}
			else
				next(future);
		}
	};
	
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

