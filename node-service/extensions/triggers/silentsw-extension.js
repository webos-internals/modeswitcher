/*
	Silentsw Configuration Object:
	
	state:					string
	
	Silentsw Status Object:
	
	activity:				integer,
	state:					string
*/

var silentswTriggers = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
	var Future = Foundations.Control.Future;
	
//
	
	var initExtension = function(future, config) {
		future.nest(PalmCall.call("palm://com.palm.keys/switches",  "status", {'get': "ringer"}));
		
		future.then(this, function(future) {
			config.state = future.result.state;
			
			future.result = true;
		});
	};
	
//
	
	var addActivity = function(future, config) {
		var newActivity = {
			"start" : true,
			"replace": true,
			"activity": {
				"name": "silentswTrigger",
				"description" : "Silent Switch Notifier",
				"type": {"foreground": true, "persist": false},
				"trigger" : {
					"method" : "palm://com.palm.keys/switches/status",
					"params" : {'subscribe': true, 'get': "ringer"}
				},
				"callback" : {
					"method" : "palm://org.webosinternals.modeswitcher.srv/trigger",
					"params" : {"extension": "silentsw"}
				}
			}
		};
		
		future.then(PalmCall.call("palm://com.palm.activitymanager", "create", newActivity));
		
		future.then(this, function(future) {
			config.activity = future.result.activityId;
			
			future.result = true;
		});
	};
	
	var delActivity = function(future, config) {
		var oldActivity = {
			"activityId": config.activity
		};
		
		future.nest(PalmCall.call("palm://com.palm.activitymanager", "cancel", oldActivity));
		
		future.then(this, function(future) {
			config.activity = null;
			
			future.result = true;
		});
	};
	
//
	
	var checkState = function(config, trigger) {
		if(config.state == trigger.state)
			return true;
		
		return false;
	};
	
	var triggerState = function(config, trigger, args) {
		if((args.$activity) && (args.$activity.trigger) &&
			(args.$activity.trigger.key == "ringer") &&
			(args.$activity.trigger.state != undefined) &&
			(config.state != args.$activity.trigger.state))
		{
			return true;
		}
		
		return false;
	};
	
// Asynchronous public functions
	
	that.initialize = function(config, triggers) {
		config.activity = null;
		config.state = "unknown";
		
		var future = new Future();
		
		if(triggers.length == 0)
			future.result = true;
		else {
			future.now(this, function(future) { 
				initExtension(future, config);
			});
			
			future.then(this, function(future) {
				future.now(this, function(future) { 
					addActivity(future, config);
				});
				
				future.then(this, function(future) {
					future.result = true;
				});
			});
		}
		
		return future;
	};
	
	that.shutdown = function(config) {
		config.state = "unknown";
		
		var future = new Future();
		
		if(!config.activity)
			future.result = true;
		else {
			future.now(this, function(future) { 
				delActivity(future, config);
			});
			
			future.then(this, function(future) {
				future.result = true;
			});
		}
		
		return future;
	};
	
//
	
	that.reload = function(config, triggers, args) {
		config.activity = null;
		config.state = "unknown";			
		
		var future = new Future();
		
		if((triggers.length == 0) ||
			(!args.$activity) || (!args.$activity.trigger) || 
			(args.$activity.trigger.returnValue == false))
		{
			future.result = true;
		}
		else {
			if(args.$activity.trigger.state != undefined)
				config.state = args.$activity.trigger.state;
			else
				config.state = "unknown";
			
			future.now(this, function(future) { 
				addActivity(future, config);
			});
			
			future.then(this, function(future) {
				future.result = true;
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
