var StatusCommandAssistant = function() {
}

//

StatusCommandAssistant.prototype.setup = function() {  
	this.id = this.controller.message.applicationID().split(" ")[0];
}

StatusCommandAssistant.prototype.run = function(future, factory) {  
	future.nest(prefs.load());
		
	future.then(this, function(future) {
		var config = future.result;

		if(this.controller.args.mode) {
			var status = this.checkModeStatus(config, this.controller.args.mode);
		
			future.result = { 
				returnValue: true,
			
				groups: status.groups,
				triggers: status.triggers };
		}
		else {
			if((this.controller.args.subscribe) && (this.id != "")) {
				var keys = ["activated", "modeLocked", "activeModes", "customModes"];
		
				prefs.addSubscription(this.id, keys, factory);
			}

			future.result = { 
				returnValue: true,
			
				activated: config.activated,
				modeLocked: config.modeLocked,
				activeModes: config.activeModes,
				customModes: config.customModes };
		}
	});
}

StatusCommandAssistant.prototype.cleanup = function() {  
	prefs.delSubscription(this.id);
}

//

StatusCommandAssistant.prototype.checkModeStatus = function(config, modeName) {  
	var mode = null;
	
	var status = {groups: [], triggers: []};

	for(var i = 0; i < config.customModes.length; i++) {
		if(config.customModes[i].name == modeName) {
			var mode = config.customModes[i];
		}
	}

	if((!mode) || (mode.triggers.list.length == 0))
		return status;

	var hadTriggers = false;

	if(mode.triggers.require == 2)
		var groups = 10;
	else
		var groups = 1;
	
	// Loop through triggers and test are they valid or no.

	for(var i = 0; i < config.extensions.triggers.length; i++) {
		for(var group = 0; group < groups; group++) {
			var triggerState = "unknown";
	
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

						status.triggers.push({"extension": extension, 'state': triggerState, 'group': group});

						if((triggerState == true) && (mode.triggers.require != 2))
							break;
						
						if((triggerState == false) && (mode.triggers.require == 2))
							break;
					}
				}
			}		

			if((mode.triggers.require == 2) && (status.groups[group] != false) && (triggerState != "unknown"))
				status.groups[group] = triggerState;
		}
		
		// If all unique then single invalid trigger is enough and
		// if any trigger then single valid trigger is enough.
		
		// For grouped modes we need to loop all triggers through.
				
		if((mode.triggers.require == 0) && (triggerState == false) && (status.groups[0] == undefined))
			status.groups[0] = false;
		else if((mode.triggers.require == 1) && (triggerState == true) && (status.groups[0] == undefined))
			status.groups[0] = true;
	}

	// If all unique and all valid then mode triggers are valid and
	// if any trigger and all invalid then mode triggers are invalid.

	if((hadTriggers) && (mode.triggers.require == 0) && (status.groups[0] == undefined)) 		
		status.groups[0] = true;
	else if((hadTriggers) && (mode.triggers.require == 1) && (status.groups[0] == undefined))
		status.groups[0] = false;
	
	// If triggers left on group pages then triggers are valid.
	
	return status;
}

