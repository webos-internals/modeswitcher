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
			var mode = null;
			
			for(var i = 0; i < config.customModes.length; i++) {
				if(config.customModes[i].name == modeName) {
					mode = config.customModes[i];
					
					break;
				}
			}
			
			if((!mode) || (mode.triggers.length == 0)) {
				future.result = { returnValue: false };
			}
			else {
				var status = this.checkModeStatus(config, this.controller.args.mode);
				
				future.result = { 
					returnValue: true,
					
					groups: status.groups,
					triggers: status.triggers };
			}
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

StatusCommandAssistant.prototype.checkModeStatus = function(config, mode) {
	var status = {groups: [], triggers: []};
	
	// Loop through triggers in all groups and test are they valid or not.
	
	for(var group = 0; group < mode.triggers.length; group++) {
		var triggerState = false;
		
		for(var i = 0; i < config.extensions.triggers.length; i++) {
			triggerState = "unknown";
			
			for(var j = 0; j < mode.triggers[group].list.length; j++) {
				var extension = mode.triggers[group].list[j].extension;
			
				if(config.extensions.triggers[i] == extension) {
					var configData = config.statusData.triggers[extension];
					
					var triggerData = mode.triggers[group].list[j];
					
					eval("triggerState = " + extension + "Triggers.check(configData, triggerData);");
					
					status.triggers.push({"extension": extension, 'state': triggerState, 'group': group});
					
					if(((triggerState == true) && (mode.triggers[group].require == 0)) ||
						((triggerState == true) && (mode.triggers[group].require == 1)) ||
						((triggerState == false) && (mode.triggers[group].require == 2)))
					{
						break;
					}
				}
			}
			
			// Check the global state for triggers with same extension
			
			if(((triggerState == false) && (mode.triggers[group].require == 0)) ||
				((triggerState == true) && (mode.triggers[group].require == 1)) ||
				((triggerState == false) && (mode.triggers[group].require == 2)))
			{
				break;
			}
		}
		
		if(triggerState == true)
			status.groups[group] = true;
		else
			status.groups[group] = false;
	}
	
	return status;
}
