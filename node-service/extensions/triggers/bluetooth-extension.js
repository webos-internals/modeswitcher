/*
	Bluetooth Configuration Object:
	
	state:					integer,
	device:					string,
	profile:					string
	
	Bluetooth Status Object:

	activity:				integer,
	connected:				[{
		device:					string,
		profile:					string 
	}],
*/

var bluetoothTriggers = (function() {
	var that = {};

	var Foundations = IMPORTS.foundations;

	var PalmCall = Foundations.Comms.PalmCall;

	var Future = Foundations.Control.Future;

//

	var addActivity = function(config) {
		var newActivity = {
			"start" : true,
			"replace": true,
			"activity": {
				"name": "bluetoothTrigger",
				"description" : "Bluetooth Connections Notifier",
				"type": {"foreground": true, "persist": false},
				"trigger" : {
					"method" : "palm://com.palm.bluetooth/prof/subscribenotifications",
					"params" : {'subscribe': true}
				},
				"callback" : {
					"method" : "palm://org.webosinternals.modeswitcher.srv/trigger",
					"params" : {"extension": "bluetooth"}
				}                                                                                           
			}
		};

		var future = PalmCall.call("palm://org.webosinternals.impersonate/", "systemCall", {
			'id': "com.palm.activitymanager", 'service': "com.palm.activitymanager", 
			'method': "create", 'params': newActivity}); 
	
		future.then(this, function(future) {
			config.activity = future.result.activityId;
		
			future.result = { returnValue: true };
		});
			
		return future;
	};
	
	var delActivity = function(config) {
		var oldActivity = {
			"activityId": config.activity
		};
	
		var future = PalmCall.call("palm://org.webosinternals.impersonate/", "systemCall", {
			'id': "com.palm.activitymanager", 'service': "com.palm.activitymanager", 
			'method': "cancel", 'params': oldActivity}); 

		future.then(this, function(future) {
			config.activity = null;

			future.result = { returnValue: true };
		});
		
		return future; 
	};

//

	var checkState = function(config, trigger) {
		for(var i = 0; i < config.connected.length; i++) {
			if((trigger.state == 0) && ((trigger.profile == "any") || 
				(trigger.profile == config.connected[i].profile)))
			{
				return true;
			}
			else if((trigger.state == 1) && ((trigger.profile != "any") && 
				(trigger.profile == config.connected[i].profile)))
			{
				return false;
			}
			else if((trigger.state == 2) && ((trigger.profile == "any") || 
				(trigger.profile == config.connected[i].profile)) && 
				(trigger.device.toLowerCase() == config.connected[i].device))
			{
				return true;
			}
			else if((trigger.state == 3) && ((trigger.profile != "any") && 
				(trigger.profile == config.connected[i].profile)) &&
				(trigger.device.toLowerCase() == config.connected[i].device))
			{
				return false;
			}
		}

		if((trigger.state == 0) || (trigger.state == 2))
			return false;

		return true;
	};

	var triggerState = function(config, trigger, args) {
		if((args.$activity) && (args.$activity.trigger) && 
			(args.$activity.trigger.notification != undefined))
		{
			var device = "unknown";
			var profile = "any";
		
			if(args.$activity.trigger.name)
				device = args.$activity.trigger.name.toLowerCase();

			if(args.$activity.trigger.profile)
				profile = args.$activity.trigger.profile;

			var index = -1;
				
			for(var i = 0; i < config.connected.length; i++) {
				if((config.connected[i].device == device) &&
					(config.connected[i].profile == profile))
				{
					index = i;
					break;
				}				
			}

			if(((index == -1) && (!args.$activity.trigger.error) &&
				(args.$activity.trigger.notification == "notifnconnected")) ||
				((index != -1) && (((args.$activity.trigger.error) &&
				(args.$activity.trigger.notification == "notifnconnected")) ||
				(args.$activity.trigger.notification == "notifndisconnected"))))
			{
				if((trigger.state == 0) && ((trigger.profile == "any") || 
					(trigger.profile == profile)))
				{
					return true;
				}
				else if((trigger.state == 1) && ((trigger.profile == "any") || 
					(trigger.profile == profile)))
				{
					return true;
				}				
				else if((trigger.state == 2) && ((trigger.profile == "any") || 
					(trigger.profile == profile)) && (trigger.device.toLowerCase() == device))
				{
					return true;
				}
				else if((trigger.state == 3) && (((trigger.profile == "any") || 
					(trigger.profile == profile)) && (trigger.device.toLowerCase() == device)))
				{
					return true;
				}
			}
		}

		return false;
	};

// Asynchronous public functions

	that.initialize = function(config, triggers) {
		config.activity = null;
		config.connected = [];

		var future = new Future();
	
		if((!triggers) || (triggers.length == 0))
			future.result = { returnValue: true };
		else {
			future.nest(addActivity(config));
			
			future.then(this, function(future) {
				future.result = { returnValue: true };
			});
		}

		return future;
	};

	that.shutdown = function(config) {
		config.connected = [];
		
		var future = new Future();

		if(!config.activity)
			future.result = { returnValue: true };
		else {
			future.nest(delActivity(config));

			future.then(this, function(future) {
				future.result = { returnValue: true };
			});
		}
					
		return future;
	};

//

	that.reload = function(config, triggers, args) {
		config.activity = null;

		var future = new Future();

		if((!args.$activity) || (!args.$activity.trigger) || 
			(args.$activity.trigger.returnValue == false))
		{
			future.result = { returnValue: true };
		}
		else {
			var device = "unknown";
			var profile = "any";
		
			if(args.$activity.trigger.name != undefined)
				device = args.$activity.trigger.name.toLowerCase();

			if(args.$activity.trigger.profile != undefined)
				profile = args.$activity.trigger.profile;

			var index = -1;

			for(var i = 0; i < config.connected.length; i++) {
				if((config.connected[i].device == device) &&
					(config.connected[i].profile == profile))
				{
					index = i;
					break;
				}				
			}

			if((index == -1) && (!args.$activity.trigger.error) &&
				(args.$activity.trigger.notification == "notifnconnected"))
			{
				config.connected.push({'device': device, 'profile': profile});
			}
			else if((index != -1) && (((args.$activity.trigger.error) &&
				(args.$activity.trigger.notification == "notifnconnected")) ||
				(args.$activity.trigger.notification == "notifndisconnected")))
			{
				config.connected.splice(index, 1);			
			}
				
			future.nest(addActivity(config));

			future.then(this, function(future) {
				future.result = { returnValue: true };
			});
		}
			
		return future;
	};

// Synchronous public functions

	that.check = function(config, trigger) {
		return checkState(config, trigger);
	};

	that.trigger = function(config, trigger, args) {
		return triggerState(config, trigger, args);
	};

	return that;
}());

