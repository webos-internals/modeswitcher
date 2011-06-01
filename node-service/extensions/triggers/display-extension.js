/*
	Display Configuration Object:
	
	locked:						boolean
	
	Display Status Object:
	
	activity:					integer,
	locked:						boolean
*/

var displayTriggers = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
	var Future = Foundations.Control.Future;
	
//
	
	var initExtension = function(future, config) {
		future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.systemmanager", 'service': "com.palm.systemmanager", 
				'method': "getLockStatus", 'params': {}}));
		
		future.then(this, function(future) {
			config.locked = future.result.locked;
			
			future.result = true;
		});
	};
	
//
	
	var addActivity = function(future, config) {
		var newActivity = {
			"start" : true,
			"replace": true,
			"activity": {
				"name": "displayTrigger",
				"description" : "Display State Notifier",
				"type": {"foreground": true, "persist": false},
				"trigger" : {
					"method" : "palm://com.palm.systemmanager/getLockStatus",
					"params" : {'subscribe': true}
				},
				"callback" : {
					"method" : "palm://org.webosinternals.modeswitcher.srv/trigger",
					"params" : {"extension": "display"}
				}
			}
		};
		
		future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
				'id': "com.palm.activitymanager", 'service': "com.palm.activitymanager", 
				'method': "create", 'params': newActivity}));
		
		future.then(this, function(future) {
			config.activity = future.result.activityId;
			
			future.result = true;
		});
	};
	
	var delActivity = function(future, config) {
		var oldActivity = {
			"activityId": config.activity
		};
		
		future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
			'id': "com.palm.activitymanager", 'service': "com.palm.activitymanager", 
			'method': "cancel", 'params': oldActivity}));
		
		future.then(this, function(future) {
			config.activity = null;
			
			future.result = true;
		});
	};
	
//
	
	var checkState = function(config, trigger) {
		if(config.locked == "unknown")
			return false;
		
		if(config.locked == trigger.locked)
			return true;
		
		return false;
	};
	
	var triggerState = function(config, trigger, args) {
		if((args.$activity) && (args.$activity.trigger) &&
			(args.$activity.trigger.locked != undefined) &&
			(config.locked != args.$activity.trigger.locked))
		{
			return true;
		}
		
		return false;
	};
	
// Asynchronous public functions
	
	that.initialize = function(config, triggers) {
		config.activity = null;
		config.locked = "unknown";
		
		var future = new Future();
		
		if(triggers.length == 0)
			future.result = { returnValue: true };
		else {
			future.now(this, function(future) {
				initExtension(future, config);
			});
			
			future.then(this, function(future) {
				future.now(this, function(future) { 
					addActivity(future, config);
				});
				
				future.then(this, function(future) {
					future.result = { returnValue: true };
				});
			});
		}
		
		return future;
	};
	
	that.shutdown = function(config) {
		config.locked = "unknown";
		
		var future = new Future();
		
		if(!config.activity)
			future.result = { returnValue: true };
		else {
			future.now(this, function(future) { 
				delActivity(future, config);
			});
			
			future.then(this, function(future) {
				future.result = { returnValue: true };
			});
		}
		
		return future;
	};
	
//
	
	that.reload = function(config, triggers, args) {
		config.activity = null;
		config.locked = "unknown";
		
		var future = new Future();
		
		if((triggers.length == 0) ||
			(!args.$activity) || (!args.$activity.trigger) || 
			(args.$activity.trigger.returnValue == false))
		{
			future.result = { returnValue: true };
		}
		else {
			if(args.$activity.trigger.locked != undefined)
				config.locked = args.$activity.trigger.locked;
			
			future.now(this, function(future) {
				addActivity(future, config);
			});
			
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
