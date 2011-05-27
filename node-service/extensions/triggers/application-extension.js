/*
	Application Configuration Object:
	
	appId:				string,
	appState:			integer
	
	Application Status Object:
	
	activity:			integer,
	appId:				string
*/

var applicationTriggers = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
	var Future = Foundations.Control.Future;
	
//
	
	var initExtension = function(future, config) {
		future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
			'id': "com.palm.systemmanager", 'service': "com.palm.systemmanager", 
			'method': "getForegroundApplication", 'params': {}}));
		
		future.then(this, function(future) {
			if(future.result.id)
				config.appId = future.result.id;
			else
				config.appId = "none";
			
			future.result = true;
		});
	};
	
//
	
	var addActivity = function(future, config) {
		var newActivity = {
			"start" : true,
			"replace": true,
			"activity": {
				"name": "applicationTrigger",
				"description" : "Foreground Application Notifier",
				"type": {"foreground": true, "persist": false},
				"trigger" : {
					"method" : "palm://com.palm.systemmanager/getForegroundApplication",
					"params" : {"subscribe": true}
				},
				"callback" : {
					"method" : "palm://org.webosinternals.modeswitcher.srv/trigger",
					"params" : {"extension": "application"}
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
		if(config.appId == "unknown")
			return false;
		
		if((trigger.appState == 0) && (config.appId == trigger.appId))
			return true;
		
		if((trigger.appState == 1) && (config.appId != trigger.appId))
			return true;
		
		return false;
	};
	
	var triggerState = function(config, trigger, args) {
		var appId = "none";
		
		if((args.$activity) && (args.$activity.trigger)) {
			if(args.$activity.trigger.id != undefined)
				appId = args.$activity.trigger.id;
			
			if(config.appId != appId)
				return true;
		}
		
		return false;
	};
	
// Asynchronous public functions
	
	that.initialize = function(config, triggers) {
		config.activity = null;
		config.appId = "unknown";
		
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
		config.appId = "unknown";
		
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
		config.appId = "unknown";
		
		var future = new Future();
		
		if((triggers.length == 0) ||
			(!args.$activity) || (!args.$activity.trigger) || 
			(args.$activity.trigger.returnValue == false))
		{
			future.result = true;
		}
		else {
			if(args.$activity.trigger.id != undefined)
				config.appId = args.$activity.trigger.id;
			else
				config.appId = "none";
			
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
