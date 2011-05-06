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
	
		if(!config.activated)
			future.result = { returnValue: false, errorText: "Not activated" };
		else if(!this.controller.args.extension)
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
				if(config.modeLocked)
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
	var blockMode = 0;
	
	var startNModes = [];
	var startMModes = [];
	var closeNModes = [];
	var closeMModes = [];
	
	// Determine the trigger blocking setting from active modes.
	
	for(var i = 0; i < config.activeModes.length; i++) {
		if(config.activeModes[i].type != "default") {
			if((config.activeModes[i].triggers.block == 1) ||
				((blockMode == 2) && (config.activeModes[i].triggers.block == 3)) ||
				((blockMode == 3) && (config.activeModes[i].triggers.block == 2)))
			{
				blockMode = 1;
				break;
			}
			else if(config.activeModes[i].triggers.block != 0)
				blockMode = config.activeModes[i].triggers.block;		
		}
	}

	// Determine the modes which should be started and / or closed.
	
	for(var i = 0; i < triggeredModes.length; i++) {
		var modeInfo = {
			name: triggeredModes[i].name,

			start: triggeredModes[i].start,
			close: triggeredModes[i].close,
			
			alert: triggeredModes[i].settings.alert
		}
	
		if(utils.findArray(config.activeModes, "name", triggeredModes[i].name) == -1) {
			if((triggeredModes[i].start != 0) && ((blockMode == 0) || 
				((blockMode == 2) && (triggeredModes[i].type != "normal")) || 
				((blockMode == 3) && (triggeredModes[i].type != "modifier"))))
			{
				if(this.checkModeTriggers(future, config, triggeredModes[i])) {
					if(triggeredModes[i].type == "normal")
						startNModes.push(modeInfo);
					else if(triggeredModes[i].type == "modifier")
						startMModes.push(modeInfo);
				}
			}
		}
		else if(triggeredModes[i].close != 0) {
			if(!this.checkModeTriggers(future, config, triggeredModes[i])) {
				if(triggeredModes[i].type == "normal")
					closeNModes.push(modeInfo);
				else if(triggeredModes[i].type == "modifier")
					closeMModes.push(modeInfo);
			}
		}
	}
	
	console.error("MS - Trigger - Launch " + startNModes.length + " " + closeNModes.length + " " + startMModes.length + " " + closeMModes.length);
	
	if((startNModes.length == 0) && (startMModes.length == 0) && 
		(closeNModes.length == 0) && (closeMModes.length == 0))
	{
		future.result = { returnValue: true };
	}
	else {
		this.executeModeLaunching(future, config, startNModes, startMModes, closeNModes, closeMModes);
	}
}

TriggerCommandAssistant.prototype.executeModeLaunching = function(future, config, startNModes, startMModes, closeNModes, closeMModes) {  

	if(((startNModes.length == 1) && (startNModes[0].start != 3)) ||
		((closeNModes.length == 1) && (closeNModes[0].close != 3)) ||
		(startNModes.length >= 2))
	{
		var startModes = [];
		var closeModes = [];
		var modifiers = [];

		if(startNModes.length > 0)
			var startModes = startNModes;
	
		if(closeNModes.length > 0)
			var closeModes = closeNModes;

		for(var i = 0; i < config.activeModes.length; i++) {
			if(utils.findArray(closeMModes, "name", config.activeModes[i].name) == -1)
				modifiers.push(config.activeModes[i].name);
		}
		
		for(var i = 0; i < startMModes.length; i++)
			modifiers.push(startMModes[i].name);
		
		var alert = config.customModes[0].settings.alert;

		for(var i = 0; i < closeModes.length; i++) {
			if(closeModes[i].alert > alert)
				alert = closeModes[i].alert;
		}

		for(var i = 0; i < startModes.length; i++) {
			if(startModes[i].alert > alert)
				alert = startModes[i].alert;
		}

		future.nest(this.PalmCall.call("palm://com.palm.applicationManager/", "launch", {
			'id': "org.webosinternals.modeswitcher", 'params': { 'action': "popup", 'alert': alert, 
				'modes': {'start': startModes, 'close': closeModes, 'modifiers': modifiers},
				'timers': {'start': config.startTimer, 'close': config.closeTimer}}}));
	}
	else if(config.activeModes.length > 0) {
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
			'action': "update", 'names': newModes}));
	}

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

