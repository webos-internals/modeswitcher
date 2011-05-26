/*
	Email Configuration Object:
	
	accounts: 				{
		'accountId':			{
			isDefault:				boolean,
			databaseId:				string,
			identifier:				string 
									}
								},
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
	
	var settingsUpdate = function(settingsOld, settingsNew, item, next, future) {
		if(item == "email-get") {
			if(settingsNew.accounts) {
					future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
						'id': "com.palm.app.email", 'service': "com.palm.db", 
						'method': "find", 'params': {'query': {'from': "com.palm.mail.account:1"}}}));
					
					future.then(this, function(future) { 
						var result = future.result;
						
						var accounts = [];
						
						for(var i = 0; i < result.results.length; i++)
							accounts.push(result.results[i].accountId);
						
						for(var accId in settingsNew.accounts) {
							if(accounts.indexOf(accId) == -1)
								delete settingsNew.accounts[accId];
						}
						
						next(future); 
					}.bind(this));
			}
			else
				next(future);
		}
		else if(item == "email-set") {
			if(settingsNew.accounts) {
				var objects = [];
				
				for(var accId in settingsNew.accounts) {
					var params  = {_id: settingsNew.accounts[accId].databaseId, notifications: {}};
					
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
		
		utils.futureLoop(future, configCalls, settingsUpdate.bind(this, settingsOld, settingsNew), 
			function(future) { future.result = { returnValue: true }; }.bind(this));
		
		return future;
	};
	
	return that;
}());
