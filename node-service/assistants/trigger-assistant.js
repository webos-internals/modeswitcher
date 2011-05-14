var TriggerCommandAssistant = function() {
	this.Foundations = IMPORTS.foundations;

	this.PalmCall = this.Foundations.Comms.PalmCall;
}

//

TriggerCommandAssistant.prototype.setup = function() {  
}

TriggerCommandAssistant.prototype.run = function(future) {  
	console.error("Trigger received: " + JSON.stringify(this.controller.args));

	future.nest(prefs.load());
	
	future.then(this, function(future) {
		var config = future.result;
	
		if((config.activated == false) || (config.activeModes.length == 0))
			future.result = { returnValue: false, errorText: "Not activated" };
		else if((!this.controller.args) || (!this.controller.args.extension))
			future.result = { returnValue: false, errorText: "No extension set" };
		else if(config.extensions.triggers.indexOf(this.controller.args.extension) == -1)
			future.result = { returnValue: false, errorText: "Unknown extension" };
		else if(config.statusData.triggers[this.controller.args.extension] == undefined)
			future.result = { returnValue: false, errorText: "Uninitialized extension" };
		else
			this.checkTriggerEvent(future, config, this.controller.args);
	});
}

TriggerCommandAssistant.prototype.cleanup = function() {  
}

//

TriggerCommandAssistant.prototype.checkTriggerEvent = function(future, config, args) {  
	var triggersData = [];
	var triggeredModes = [];

	var configData = config.statusData.triggers[args.extension];

	for(var i = 0; i < config.customModes.length; i++) {
		for(var j = 0; j < config.customModes[i].triggers.list.length; j++) {
			if(config.customModes[i].triggers.list[j].extension == args.extension) {
				var triggerData = config.customModes[i].triggers.list[j];

				eval("var triggered = " + args.extension + "Triggers.trigger(configData, triggerData, args);");

				triggersData.push(config.customModes[i].triggers.list[j]);
		
				if(triggered) {
					if(utils.findArray(triggeredModes, "name", config.customModes[i].name) == -1)
						triggeredModes.push(config.customModes[i]);
				}
			}
		}
	}

	console.error("MS - Trigger - Check " + triggeredModes.length);

	eval("future.nest(" + args.extension + "Triggers.reload(configData, triggersData, args));");

	future.then(this, function(future) {
		var newConfig = {statusData: {triggers: {}}};
		
		newConfig.statusData.triggers[args.extension] = config.statusData.triggers[args.extension];
	
		future.nest(prefs.save(newConfig));

		future.then(this, function(future) {
			if(future.result.returnValue != true)
				future.result = { returnValue: false };
			else {				
				if(config.modeLocked == true)
					future.result = { returnValue: true };
				else if(triggeredModes.length == 0)
					future.result = { returnValue: true };
				else			
					this.handleModeLaunching(future, config, triggeredModes);
			}
		});
	});
}

TriggerCommandAssistant.prototype.handleModeLaunching = function(future, config, triggeredModes) {  
	var usePopup = false, startNModes = [], startMModes = [], closeNModes = [], closeMModes = [];
	
	// Determine the modes which should be started and / or closed.
	
	for(var i = 0; i < triggeredModes.length; i++) {
		if(utils.findArray(config.activeModes, "name", triggeredModes[i].name) == -1) {
			if(triggeredModes[i].start != 0) {
				if(this.checkModeTriggers(future, config, triggeredModes[i])) {
					if(triggeredModes[i].start != 3)
						usePopup = true;
				
					if(triggeredModes[i].type == "normal") {
						startNModes.push({
							name: triggeredModes[i].name,
							start: triggeredModes[i].start,
							notify: triggeredModes[i].settings.notify });
					}
					else if(triggeredModes[i].type == "modifier") {
						startMModes.push({
							name: triggeredModes[i].name,
							start: triggeredModes[i].start,
							notify: triggeredModes[i].settings.notify });
					}
				}
			}
		}
		else if(triggeredModes[i].close != 0) {
			if(!this.checkModeTriggers(future, config, triggeredModes[i])) {
				if(triggeredModes[i].close != 3)
					usePopup = true;

				if(triggeredModes[i].type == "normal") {
					closeNModes.push({
						name: triggeredModes[i].name,
						close: triggeredModes[i].close,
						notify: triggeredModes[i].settings.notify });
				}
				else if(triggeredModes[i].type == "modifier") {
					closeMModes.push({
						name: triggeredModes[i].name,
						close: triggeredModes[i].close,
						notify: triggeredModes[i].settings.notify });
				}
			}
		}
	}
	
	console.error("MS - Trigger - Launch " + startNModes.length + " " + closeNModes.length + " " + startMModes.length + " " + closeMModes.length);
	
	if((startNModes.length == 0) && (startMModes.length == 0) && 
		(closeNModes.length == 0) && (closeMModes.length == 0))
	{
		future.result = { returnValue: true };
	}
	else if((!usePopup) && (startNModes.length < 2) && (closeNModes.length < 2))
		this.executeModeLaunching(future, config, startNModes, startMModes, closeNModes, closeMModes);
	else
		this.executePopupLaunching(future, config, startNModes, startMModes, closeNModes, closeMModes);
}

TriggerCommandAssistant.prototype.executeModeLaunching = function(future, config, startNModes, startMModes, closeNModes, closeMModes) {  
	var newModes = [config.activeModes[0].name];

	if(startNModes.length == 1)
		newModes[0] = startNModes[0].name;

	if(closeNModes.length == 1)
		newModes[0] = "Default Mode";
	
	for(var i = 1; i < config.activeModes.length; i++) {
		if(utils.findArray(closeMModes, "name", config.activeModes[i].name) == -1)
			newModes.push(config.activeModes[i].name);
	}

	for(var i = 1; i < config.customModes.length; i++) {
		if(utils.findArray(startMModes, "name", config.customModes[i].name) != -1)
			newModes.push(config.customModes[i].name);
	}

	future.nest(this.PalmCall.call("palm://org.webosinternals.modeswitcher.srv", "execute", {
		'action': "update", 'names': newModes, 'notify': true}));

	future.then(this, function(future) {
		future.result = { returnValue: true };
	});
}

TriggerCommandAssistant.prototype.executePopupLaunching = function(future, config, startNModes, startMModes, closeNModes, closeMModes) {  
	var newModes = [];

	// Form notify setting based on all triggered modes

	var notify = config.customModes[0].settings.notify;

	for(var i = 0; i < closeMModes.length; i++) {
		if(closeMModes[i].notify > notify)
			notify = closeMModes[i].notify;
	}

	for(var i = 0; i < closeNModes.length; i++) {
		if(closeNModes[i].notify > notify)
			notify = closeNModes[i].notify;
	}

	for(var i = 0; i < startMModes.length; i++) {
		if(startMModes[i].notify > notify)
			notify = startMModes[i].notify;
	}

	for(var i = 0; i < startNModes.length; i++) {
		if(startNModes[i].notify > notify)
			notify = startNModes[i].notify;
	}

	// Form new modes list based on modes not needing popup

	newModes.push(config.activeModes[0].name);

	if((closeNModes.length == 1) && (closeNModes[0].close == 3)) {
		newModes.push("Default Mode");

		closeNModes = [];
	}
		
	if((startNModes.length == 1) && (startNModes[0].start == 3)) {
		newModes.push(startNModes[0].name);

		startNModes = [];
	}

	for(var i = 1; i < config.activeModes.length; i++) {
		var index = utils.findArray(closeMModes, "name", config.activeModes[i].name);
		
		if((config.activeModes[i].close != 3) || (index == -1))
			newModes.push(config.activeModes[i].name);
		else if(index != -1)
			closeMModes.splice(index, 1);
	}

	for(var i = 1; i < config.customModes.length; i++) {
		var index = utils.findArray(startMModes, "name", config.customModes[i].name);
		
		if((config.customModes[i].start == 3) && (index != -1)) {
			startMModes.splice(index, 1);
		
			newModes.push(config.customModes[i].name);
		}
	}

	future.nest(this.PalmCall.call("palm://com.palm.applicationManager/", "launch", {
		'id': "org.webosinternals.modeswitcher", 'params': { 'action': "popup", 
			'notify': notify, 'names': newModes, 'modes': { 'startN': startNModes, 
				'closeN': closeNModes, 'startM': startMModes, 'closeM': closeMModes},
			'timers': {'start': config.startTimer, 'close': config.closeTimer}}}));

	future.then(this, function(future) {
		future.result = { returnValue: true };
	});
}

//

TriggerCommandAssistant.prototype.checkModeTriggers = function(future, config, mode) {  
	// If mode does not have triggers then always return true.

	if(mode.triggers.list.length == 0)
		return true;

	var hadTriggers = false;

	var grouped = new Array(10);

	if(mode.triggers.require == 2)
		var groups = 10;
	else
		var groups = 1;
	
	// Loop through triggers and test are they valid or no.

	for(var i = 0; i < config.extensions.triggers.length; i++) {
		for(var group = 0; group < groups; group++) {
			var triggerState = "unknown";
	
			if(grouped[group] != false) {
				for(var j = 0; j < mode.triggers.list.length; j++) {
					if((mode.triggers.list[j].group == undefined) ||
						(mode.triggers.list[j].group == group))
					{
						if(config.extensions.triggers[i] == mode.triggers.list[j].extension) {
							hadTriggers = true;

							var extension = config.extensions.triggers[i];
						
							var configData = config.statusData.triggers[extension];
							var triggerData = mode.triggers.list[j];
						
							eval("triggerState = " + extension + "Triggers.check(configData, triggerData);");

							if((triggerState == true) && (mode.triggers.require != 2))
								break;
							
							if((triggerState == false) && (mode.triggers.require == 2))
								break;
						}
					}
				}		

				if((mode.triggers.require == 2) && (triggerState != "unknown"))
					grouped[group] = triggerState;
			}
		}
		
		// If all unique then single invalid trigger is enough and
		// if any trigger then single valid trigger is enough.
		
		// For grouped modes we need to loop all triggers through.
				
		if((mode.triggers.require == 0) && (triggerState == false))
			return false;
		else if((mode.triggers.require == 1) && (triggerState == true))
			return true;
	}

	// If all unique and all valid then mode triggers are valid and
	// if any trigger and all invalid then mode triggers are invalid.

	if((hadTriggers) && (mode.triggers.require == 0)) 		
		return true;
	else if((hadTriggers) && (mode.triggers.require == 1))
		return false;
	else if((hadTriggers) && (mode.triggers.require == 2)) {
		for(var i = 0; i < grouped.length; i++) {
			if(grouped[i] == true)
				return true;
		}
		
		return false;
	}
	
	// If triggers left on group pages then triggers are valid.
	
	return true;
}

