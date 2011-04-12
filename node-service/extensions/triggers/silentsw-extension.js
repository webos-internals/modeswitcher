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

	var initExtension = function(config) {
		var future = PalmCall.call("palm://com.palm.keys/switches",  "status", {'get': "ringer"}); 
		
		future.then(this, function(future) {
			config.state = future.result.state;
		
			future.result = { returnValue: true };
		});
		
		return future;
	};

//

	var addActivity = function(config) {
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

		var future = PalmCall.call("palm://com.palm.activitymanager", "create", newActivity);					
		
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
	
		var future = PalmCall.call("palm://com.palm.activitymanager", "cancel", oldActivity);					

		future.then(this, function(future) {
			config.activity = null;

			future.result = { returnValue: true };
		});
		
		return future; 
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
	
		if((!triggers) || (triggers.length == 0))
			future.result = { returnValue: true };
		else {
			future.nest(initExtension(config));
			
			future.then(this, function(future) {
				future.nest(addActivity(config));
				
				future.then(this, function(future) {
					future.result = { returnValue: true };
				});
			});
		}

		return future;
	};

	that.shutdown = function(config) {
		config.state = "unknown";
		
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
		config.state = "unknown";			

		var future = new Future();

		if((!triggers) || (triggers.length == 0) ||
			(!args.$activity) || (!args.$activity.trigger) || 
			(args.$activity.trigger.returnValue == false))
		{
			future.result = { returnValue: true };
		}
		else {
			if(args.$activity.trigger.state != undefined)
				config.state = args.$activity.trigger.state;
			else
				config.state = "unknown";

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
