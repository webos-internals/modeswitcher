/*
	Interval Configuration Object:
	
	intervalHours:				integer,
	intervalMinutes:			integer,
	activeHours:				integer,
	activeMinutes:				integer
	
	Interval Status Object:
	
	activities:					[integer]
	
*/

var intervalTriggers = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
	var Future = Foundations.Control.Future;
	
//
	
	var addActivity = function(config, item) {
		var future = new Future();
	
		if(((item.intervalHours != 0) || (item.intervalMinutes != 0)) &&
			((item.activeHours != 0) && (item.activeMinutes != 0)) &&
			((item.intervalHours != item.activeHours) || (item.intervalMinutes != item.activeMinutes)))
		{
			var hours = item.intervalHours;
			var minutes = item.intervalMinutes;
			
			if(hours < 10)
				hours = "0" + hours;
			
			if(minutes < 10)
				minutes = "0" + minutes;
			
			var curDate = new Date();
			var startDate = new Date();
			
			startDate.setHours(0);
			startDate.setMinutes(0);
			startDate.setSeconds(0);
			startDate.setMilliseconds(0);
			
			while(startDate.getTime() <= curDate.getTime()) {
				startDate.setHours(startDate.getHours() + item.intervalHours);
				startDate.setMinutes(startDate.getMinutes() + item.intervalMinutes);
			}
			
			var closeDate = new Date(startDate.getTime());
			
			closeDate.setHours(closeDate.getHours() + item.activeHours);
			closeDate.setMinutes(closeDate.getMinutes() + item.activeMinutes);
			
			var startTime = convertDateToUtfStr(startDate);
			var closeTime = convertDateToUtfStr(closeDate);
			
			var newStartActivity = {
				"start" : true,
				"replace": true,
				"activity": {
					"name": "intervalTrigger" + startTime,
					"description" : "Interval Start Notifier",
					"type": {"foreground": true, "persist": false},
					"schedule": {
						"precise": true,
						"start": startTime,
						"local": false, 
						"skip": true
					},
					"callback" : {
						"method" : "palm://org.webosinternals.modeswitcher.srv/trigger",
						"params" : {"extension": "interval", "timestamp": startDate.getTime()}
					}
				}
			};
			
			var newCloseActivity = {
				"start" : true,
				"replace": true,
				"activity": {
					"name": "intervalTrigger" + closeTime,
					"description" : "Interval Close Notifier",
					"type": {"foreground": true, "persist": false},
					"schedule": {
						"precise": true,
						"start": closeTime,
						"local": false, 
						"skip": true
					},
					"callback" : {
						"method" : "palm://org.webosinternals.modeswitcher.srv/trigger",
						"params" : {"extension": "interval", "timestamp": closeDate.getTime()}
					}
				}
			};
			
			future.nest(PalmCall.call("palm://com.palm.activitymanager", "create", newStartActivity));
			
			future.then(this, function(future) {
				config.activities.push(future.result.activityId);
				
				future.nest(PalmCall.call("palm://com.palm.activitymanager", "create", newCloseActivity));
				
				future.then(this, function(future) {
					config.activities.push(future.result.activityId);
					
					future.result = { returnValue: true };
				});
			});
		}
		else
			future.result = { returnValue: true };

		return future;
	};
	
	var delActivity = function(item) {
		var oldActivity = {
			"activityId": item 
		};
		
		var future = PalmCall.call("palm://com.palm.activitymanager", "cancel", oldActivity);
		
		future.then(this, function(future) {
			future.result = { returnValue: true };
		});
		
		return future; 
	};
	
//
	
	var checkState = function(config, trigger) {
		var curDate = new Date();
		var startDate = new Date();
		
		startDate.setHours(0);
		startDate.setMinutes(0);
		startDate.setSeconds(0);
		startDate.setMilliseconds(0);
		
		while(startDate.getTime() < curDate.getTime()) {
			startDate.setHours(startDate.getHours() + trigger.intervalHours);
			startDate.setMinutes(startDate.getMinutes() + trigger.intervalMinutes);
		}
		
		startDate.setHours(startDate.getHours() - trigger.intervalHours);
		startDate.setMinutes(startDate.getMinutes() - trigger.intervalMinutes);
		
		var closeDate = new Date(startDate.getTime());
		
		closeDate.setHours(closeDate.getHours() + trigger.activeHours);
		closeDate.setMinutes(closeDate.getMinutes() + trigger.activeMinutes);
		
		if((startDate.getTime() <= curDate.getTime()) && 
			(closeDate.getTime() > curDate.getTime()))
		{
			return true;
		}
		
		return false;
	};
	
	var triggerState = function(config, trigger, args) {
		if(args.timestamp) {
			var curDate = new Date();
			var startDate = new Date();
			
			startDate.setHours(0);
			startDate.setMinutes(0);
			startDate.setSeconds(0);
			startDate.setMilliseconds(0);
			
			var closeDate = new Date(startDate.getTime());
			
			closeDate.setHours(closeDate.getHours() + trigger.activeHours);
			closeDate.setMinutes(closeDate.getMinutes() + trigger.activeMinutes);
			
			while(startDate.getTime() < args.timestamp) {
				startDate.setHours(startDate.getHours() + trigger.intervalHours);
				startDate.setMinutes(startDate.getMinutes() + trigger.intervalMinutes);
			}
			
			while(closeDate.getTime() < args.timestamp) {
				closeDate.setHours(closeDate.getHours() + trigger.intervalHours);
				closeDate.setMinutes(closeDate.getMinutes() + trigger.intervalMinutes);
			}
			
			if((startDate.getTime() == args.timestamp) || (closeDate.getTime() == args.timestamp))
				return true;
		}
		
		return false;
	};
	
//
	
	var convertDateToUtfStr = function(date) {
		var day = date.getUTCDate();
		if(day < 10) day = "0" + day;
		var month = date.getUTCMonth()+1;
		if(month < 10) month = "0" + month;
		var year = date.getUTCFullYear();
		
		var hours = date.getUTCHours();
		if(hours < 10) hours = "0" + hours;
		var minutes = date.getUTCMinutes();
		if(minutes < 10) minutes = "0" + minutes;
		
		var seconds = date.getUTCSeconds();
		if(seconds < 10) seconds = "0" + seconds;
		
		var str = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
		
		return str;
	};
	
// Asynchronous public functions
	
	that.initialize = function(config, triggers) {
		config.activities = [];
		
		var future = new Future();
		
		if((!triggers) || (triggers.length == 0))
			future.result = { returnValue: true };
		else {
			future.nest(utils.futureLoop(triggers, 
				addActivity.bind(this, config)));
			
			future.then(this,  function(future) { 
				future.result = { returnValue: true }; 
			});
		}
		
		return future;	
	};
	
	that.shutdown = function(config) {
		var future = new Future();
		
		if((!config.activities) || (config.activities.length == 0))
			future.result = { returnValue: true };
		else {
			future.nest(utils.futureLoop(config.activities, 
				delActivity.bind(this)));
			
			future.then(this, function(future) {
				config.activities = [];
				config.activeModes = [];
				
				future.result = { returnValue: true };
			});
		}
		
		return future;
	};
	
//
	
	that.reload = function(config, triggers, args) {
		var future = new Future();
		
		if((!triggers) || (triggers.length == 0) || 
			(!args.timestamp) || (!args.$activity))
		{
			future.result = { returnValue: true };
		}
		else {
			var index = config.activities.indexOf(args.$activity.activityId);
			
			if(index != -1)
				config.activities.splice(index, 1);
			
			future.nest(utils.futureLoop(triggers, 
				addActivity.bind(this, config)));
			
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
