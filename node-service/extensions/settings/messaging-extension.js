/*
	Messaging Configuration Object:
	
	accounts: 				[{
		id:						string,
		accountId:				string,
		serviceName:			string,
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
	availability:			{
		'accountId':			integer
								}
*/	

var messagingSettings = (function() {
	var that = {};

	var Foundations = IMPORTS.foundations;

	var Future = Foundations.Control.Future;

	var PalmCall = Foundations.Comms.PalmCall;

	var configCalls = ["msg"];

//
	
	var settingsUpdate = function(future, settingsOld, settingsNew, item, next, newFuture) {
		if(newFuture)
			future = newFuture;

		if(item == "msg") {
			if((settingsNew.accounts) && (settingsNew.accounts.length > 0)) {
				var objects = [];

				var notifParams  = {_id: settingsNew.accounts[0].id};

				for(var i = 0; i < settingsNew.accounts.length; i++) {
					var accId = settingsNew.accounts[i].accountId;
					var sName = settingsNew.accounts[i].serviceName;

					if(accId == "sms") {
						if((settingsNew.blinkNotify[accId] != undefined) && ((!settingsOld.blinkNotify) ||
							(settingsOld.blinkNotify[accId] != settingsNew.blinkNotify[accId])))
						{
							notifParams.blinkNotification = settingsNew.blinkNotify[accId];
						}

						if((settingsNew.notifyAlert[accId] != undefined) && ((!settingsOld.notifyAlert) ||
							(settingsOld.notifyAlert[accId] != settingsNew.notifyAlert[accId])))
						{
							notifParams.notificationSound = settingsNew.notifyAlert[accId];
						}

						if((settingsNew.ringtonePath[accId] != undefined) && ((!settingsOld.ringtonePath) ||
							(settingsOld.ringtonePath[accId] != settingsNew.ringtonePath[accId])))
						{
							notifParams.ringtone = {
								name: settingsNew.ringtoneName[accId],
								path: settingsNew.ringtonePath[accId] };
						}
					}
					else {
						if((settingsNew.blinkNotify[accId] != undefined) && ((!settingsOld.blinkNotify) ||
							(settingsOld.blinkNotify[accId] != settingsNew.blinkNotify[accId])))
						{
							if(!notifParams.accountNotifications)
								notifParams.accountNotifications = {};
							
							if(!notifParams.accountNotifications[sName])
								notifParams.accountNotifications[sName] = {};
						
							notifParams.accountNotifications[sName].blinkNotification = settingsNew.blinkNotify[accId];
						}

						if((settingsNew.notifyAlert[accId] != undefined) && ((!settingsOld.notifyAlert) ||
							(settingsOld.notifyAlert[accId] != settingsNew.notifyAlert[accId])))
						{
							if(!notifParams.accountNotifications)
								notifParams.accountNotifications = {};

							if(!notifParams.accountNotifications[sName])
								notifParams.accountNotifications[sName] = {};

							notifParams.accountNotifications[sName].notificationSound = settingsNew.notifyAlert[accId];
						}

						if((settingsNew.ringtonePath[accId] != undefined) && ((!settingsOld.ringtonePath) ||
							(settingsOld.ringtonePath[accId] != settingsNew.ringtonePath[accId])))
						{
							if(!notifParams.accountNotifications)
								notifParams.accountNotifications = {};

							if(!notifParams.accountNotifications[sName])
								notifParams.accountNotifications[sName] = {};

							notifParams.accountNotifications[sName].ringtone = {
								name: settingsNew.ringtoneName[accId],
								path: settingsNew.ringtonePath[accId] };
						}

						var params = {_id: settingsNew.accounts[i].id};
				
						if((settingsNew.availability[accId] != undefined) && ((!settingsOld.availability) ||
							(settingsOld.availability[accId] != settingsNew.availability[accId])))
						{
							params.availability = parseInt(settingsNew.availability[accId]);
						}
				
						if(params.availability != undefined) {
							objects.push(params);
						}
					}
				}
		
				if((notifParams.blinkNotification != undefined) || (notifParams.notificationSound != undefined) ||  
					(notifParams.ringtone != undefined) || (notifParams.accountNotifications != undefined))
				{
					objects.push(notifParams);
				}
		
				if(objects.length > 0) {
					future.nest(PalmCall.call("palm://org.webosinternals.impersonate/", "systemCall", {
						'id': "com.palm.app.messaging", 'service': "com.palm.db", 
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

