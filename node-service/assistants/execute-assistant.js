var ExecuteCommandAssistant = function() {
	this.Foundations = IMPORTS.foundations;

	this.PalmCall = this.Foundations.Comms.PalmCall;
}

//

ExecuteCommandAssistant.prototype.setup = function() {  
}

ExecuteCommandAssistant.prototype.run = function(future) {  
	console.error("MS - Execute - Run - " + JSON.stringify(this.controller.args));

	future.nest(prefs.load());
	
	future.then(this, function(future) {
		var config = future.result;
		
		if(config.activated == false)
			future.result = { returnValue: false, errorText: "Not activated" };
		else {
			if(this.controller.args.action == "start")
				this.executeStartMode(future, config, this.controller.args);
			else if(this.controller.args.action == "close")
				this.executeCloseMode(future, config, this.controller.args);
			else if(this.controller.args.action == "toggle")
				this.executeToggleMode(future, config, this.controller.args);
			else if(this.controller.args.action == "reload")
				this.executeReloadMode(future, config, this.controller.args);
			else if(this.controller.args.action == "update")
				this.executeUpdateMode(future, config, this.controller.args);
			else if(this.controller.args.action == "trigger")
				this.executeTriggerMode(future, config, this.controller.args);
		}
	});
}

ExecuteCommandAssistant.prototype.cleanup = function() {  
}

//

ExecuteCommandAssistant.prototype.executeStartMode = function(future, config, args) {  
	if(args.name) {
		console.error("Executing starting of: " + args.name);

		// Check and find information for requested mode.

		var requestedMode = null;

		if((args.name == "Current Mode") && (config.activeModes.length > 0))
			args.name = config.activeModes[0].name;
		else if((args.name == "Previous Mode") && (config.historyList.length > 0))
			args.name = config.historyList[0].name;
	
		var index = utils.findArray(config.customModes, "name", args.name);

		if(index != -1)
			requestedMode = config.customModes[index];
		
		// If requested mode not found then do nothing.
		
		if(requestedMode == null)
			future.result = { returnValue: false, errorText: "Mode not found" };
		else {
			// Define and locate original mode for update.

			var newActiveModes = [config.customModes[0]];

			if(requestedMode.type == "normal")
				newActiveModes[0] = requestedMode;
			else if((requestedMode.type == "modifier") && (config.activeModes.length > 0)) {
				var index = utils.findArray(config.customModes, "name", config.activeModes[0].name);

				if((index != -1) && (config.customModes[index].type == "normal"))
					newActiveModes[0] = config.customModes[index];
			}
			
			// Generate list of modifier modes for update.

			if(args.name != "Current Mode") {
				for(var i = 1; i < config.activeModes.length; i++) {
					var index = utils.findArray(config.customModes, "name", config.activeModes[i].name);
		
					if((index != -1) && (config.customModes[index].type == "modifier")) {
						if(config.activeModes[i].name != args.name)
							newActiveModes.push(config.customModes[index]);
					}
				}
			}
			
			if(requestedMode.type == "modifier")
				newActiveModes.push(requestedMode);

			// Notify about the mode starting.
		
			if(requestedMode.settings.notify != 0)
				var notify = requestedMode.settings.notify;
			else
				var notify = config.customModes[0].settings.notify;
		
			if((requestedMode.type == "default") || (config.activeModes.length == 0))
				utils.notify(notify, requestedMode.name, "start");
			else if(requestedMode.type == "normal")
				utils.notify(notify, newActiveModes[0].name, "switch");
			else if(requestedMode.type == "modifier")
				utils.notify(notify, requestedMode.name, "start");
			
			// Initiate the actual updating of the mode.

			this.prepareModeChange(future, config, newActiveModes, "init", 0);
		}
	}
	else {
		console.error("Start mode called without name!");
	
		future.result = { returnValue: false, errorText: "No name given" };
	}
}

ExecuteCommandAssistant.prototype.executeCloseMode = function(future, config, args) {  
	if(args.name) {
		console.error("Executing closing of: " + args.name);

		// Check that requested mode is currently active.

		var requestedMode = null;

		if((args.name == "Current Mode") && (config.activeModes.length > 0))
			args.name = config.activeModes[0].name;
		else if((args.name == "Previous Mode") && (config.historyList.length > 0))
			args.name = config.historyList[0].name;

		var index = utils.findArray(config.customModes, "name", args.name);

		if(index != -1)
			requestedMode = config.customModes[index];
	
		// If requested mode not found then do nothing.
	
		if(requestedMode == null)
			future.result = { returnValue: false, errorText: "Mode not found" };
		else {
			// Define and locate original mode for update.

			var newActiveModes = [config.customModes[0]];

			if((requestedMode.type == "modifier") && (config.activeModes.length > 0)) {
				var index = utils.findArray(config.customModes, "name", config.activeModes[0].name);

				if((index != -1) && (config.customModes[index].type == "normal"))
					newActiveModes[0] = config.customModes[index];
			}
	
			// Generate list of modifier modes for update.

			if(args.name != "Current Mode") {
				for(var i = 1; i < config.activeModes.length; i++) {
					var index = utils.findArray(config.customModes, "name", config.activeModes[i].name);
		
					if((index != -1) && (config.customModes[index].type == "modifier")) {
						if(config.activeModes[i].name != args.name)
							newActiveModes.push(config.customModes[index]);
					}
				}
			}
			
			// Notify about the mode closing.

			if(requestedMode.settings.notify != 0)
				var notify = requestedMode.settings.notify;
			else
				var notify = config.customModes[0].settings.notify;

			if(requestedMode.type == "default")
				utils.notify(notify, requestedMode.name, "close");
			else if(requestedMode.type == "normal")
				utils.notify(notify, newActiveModes[0].name, "switch");
			else if(requestedMode.type == "modifier")
				utils.notify(notify, requestedMode.name, "close");

			// Initiate the actual updating of the mode.

			this.prepareModeChange(future, config, newActiveModes, "init", 0);
		}
	}
	else {
		console.error("Close mode called without name!");

		future.result = { returnValue: false, errorText: "No name given" };
	}
}

ExecuteCommandAssistant.prototype.executeToggleMode = function(future, config, args) {  
	if(args.name) {
		console.error("Executing toggling of: " + args.name);

		if((args.name == "Current Mode") && (config.activeModes.length > 0))
			args.name = config.activeModes[0].name;
		else if((args.name == "Previous Mode") && (config.historyList.length > 0))
			args.name = config.historyList[0].name;

		if(utils.findArray(config.activeModes, "name", args.name) != -1)
			this.executeCloseMode(future, config, args);
		else if(utils.findArray(config.customModes, "name", args.name) != -1)
			this.executeStartMode(future, config, args);
		else {
			utils.notify(5, args.name, "unknown");

			future.result = { returnValue: false, errorText: "Mode not found" };
		}
	}
	else {
		console.error("Toggle mode called without name!");
		
		future.result = { returnValue: false, errorText: "No name given" };
	}
}

ExecuteCommandAssistant.prototype.executeReloadMode = function(future, config, args) {  
	if(args.name) {
		if(config.activeModes.length == 0) {
			console.error("Executing reloading of: Default Mode");

			this.executeStartMode(future, config, "Default Mode");
		}
		else {
			console.error("Executing reloading of: Current Mode");

			// On reload inform the user even if notifications are disabled.

			utils.notify(2, "Current Mode", "reload");

			if((config.activeModes.length > 0) && (config.customModes.length > 0)) {
				var curActiveModes = [config.customModes[0]];

				// Check that original mode still exists and triggers are valid.

				var index = utils.findArray(config.customModes, "name", config.activeModes[0].name);

				if((index != -1) && (config.customModes[index].type == "normal")) {
					if(this.checkModeTriggers(future, config, config.customModes[index]))
						curActiveModes[0] = config.customModes[index];
				}
		
				// Check that modifier modes still exists and triggers are valid.

				for(var i = 1; i < config.activeModes.length; i++) {
					var index = utils.findArray(config.customModes, "name", config.activeModes[i].name);

					if((index != -1) && (config.customModes[index].type == "modifier")) {
						if(this.checkModeTriggers(future, config, config.customModes[index]))
							curActiveModes.push(config.customModes[index]);
					}
				}
		
				// Execute the actual updating of current mode (if there's changes).

				this.prepareModeChange(future, config, curActiveModes, "init", 0);
			}
			else
				future.result = { returnValue: false, errorText: "No current mode" };
		}
	}
	else {
		console.error("Reload mode called without name!");
		
		future.result = { returnValue: false, errorText: "No name given" };
	}
}

ExecuteCommandAssistant.prototype.executeUpdateMode = function(future, config, args) {  
	if(args.names) {
		console.error("Executing mode update: " + JSON.stringify(args.names));

		var newActiveModes = [config.customModes[0]];

		var index = utils.findArray(config.customModes, "name", args.names[0]);
		
		if((index != -1) && (config.customModes[index].type == "normal"))
			newActiveModes[0] = config.customModes[index];
		
		for(var i = 1; i < args.names.length; i++) {
			var index = utils.findArray(config.customModes, "name", args.names[i]);
			
			if((index != -1) && (config.customModes[index].type == "modifier")) 
				newActiveModes.push(config.customModes[index]);
		}

		if(args.notify == false)
			var notify = 0;
		else {
			if(newActiveModes[0].settings.notify != 0)
				var notify = newActiveModes[0].settings.notify;
			else
				var notify = config.customModes[0].settings.notify;
		}
		
		utils.notify(notify, "Current Mode", "update");			

		this.prepareModeChange(future, config, newActiveModes, "init", 0);
	}
	else {
		console.error("Update mode called without names!");
	
		future.result = { returnValue: false, errorText: "No names given" };
	}
}

ExecuteCommandAssistant.prototype.executeTriggerMode = function(future, config, args) {  
	if(args.name) {
		console.error("Executing triggering of: " + args.name);

		if((args.name == "Current Mode") && (config.activeModes.length > 0))
			args.name = config.activeModes[0].name;
		else if((args.name == "Previous Mode") && (config.historyList.length > 0))
			args.name = config.historyList[0].name;

		var index = utils.findArray(config.customModes, "name", args.name);

		if(index != -1) {
			if(utils.findArray(config.activeModes, "name", args.name) == -1)
			{
				if(this.checkModeTriggers(future, config, config.customModes[index]))
					this.executeStartMode(future, config, args.name);
				else
					future.result = { returnValue: true };
			}
			else {
				if(!this.checkModeTriggers(future, config, config.customModes[index]))
					this.executeCloseMode(future, config, args.name);
				else
					future.result = { returnValue: true };
			}
		}
		else
			future.result = { returnValue: false, errorText: "Mode not found" };
	}
	else {
		console.error("Trigger mode called without name!");
	
		future.result = { returnValue: false, errorText: "No name given" };
	}
}

//

ExecuteCommandAssistant.prototype.checkModeTriggers = function(future, config, mode) {  
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

//

ExecuteCommandAssistant.prototype.prepareModeChange = function(future, config, newActiveModes, roundPhase, roundCount) {  
	console.error("Executing mode updating: " + roundPhase + " " + roundCount);

	var lockedState = config.modeLocked;
	var changed = false;
	var control = new Array();

	if(config.activeModes.length > 0)
		var oldActiveModes = config.activeModes;
	else
		var oldActiveModes = [];

	var modesA = [oldActiveModes, newActiveModes];
	var modesB = [newActiveModes, oldActiveModes];

	if(roundPhase == "init")
		var events = ["close", "start"];
	else
		var events = ["closed", "started"];

	for(var loop = 0; loop < 2; loop++) {
		control = new Array();
	
		for(var i = 0; i < modesA[loop].length; i++) {
			if((this.controller.args.startup) || (utils.findArray(modesB[loop], "name", modesA[loop][i].name) == -1)) {
				for(var j = 0; j < modesA[loop][i].appssrvs.list.length; j++) {
					if(modesA[loop][i].appssrvs.list[j].type == "ms") {
						// Should check for: reloading, starting, switching and closing.
					
						if(((modesA[loop][i].appssrvs.list[j].event == events[loop]) ||
							((modesA[loop][i].appssrvs.list[j].event == "switch") && (roundPhase == "init")) ||
							((modesA[loop][i].appssrvs.list[j].event == "switched") && (roundPhase == "done"))) &&
							((((this.controller.args.startup) || (newActiveModes[0].type != "default") ||
							(oldActiveModes.length == 0) || (oldActiveModes[0].type == "default")) && 
							((events[loop] == "start") || (events[loop] == "started"))) ||
							(modesA[loop][i].appssrvs.list[j].force == "yes") || 
							(((newActiveModes[0].type == "default") || 
							(modesA[loop][i].type == "modifier")) &&
							((events[loop] == "close") || (events[loop] == "closed"))))) 
						{
							if(modesA[loop][i].appssrvs.list[j].action == "lock")
								lockedState = true;
							else if(modesA[loop][i].appssrvs.list[j].action == "unlock")
								lockedState = false;
							else		
								control.push(modesA[loop][i].appssrvs.list[j]);
						}
					}
				}
			}
		}

		for(var i = 0; i < control.length; i++) {
			var modeName = control[i].mode;

			if(modeName == "All Normal Modes") {
				if(control[i].action == "trigger") {
					for(var j = 0; j < config.customModes.length; j++) {
						if((config.customModes[j].type == "normal") &&
							(config.customModes[j].start != 0) &&
							(config.customModes[j].name != newActiveModes[0].name) &&
							(this.checkModeTriggers(future, config, config.customModes[j])))
						{
							changed = true;
							newActiveModes.splice(0, 1, config.customModes[j]);
							break;
						}
					}			
				}
			}
			else if(modeName == "All Modifier Modes") {
				if(control[i].action == "close") {
					if(newActiveModes.length > 1) {
						changed = true;
						newActiveModes.splice(1, newActiveModes.length - 1);
					}
				}
				else if((control[i].action == "start") || (control[i].action == "trigger")) {
					for(var j = 0; j < config.customModes.length; j ++) {
						if((config.customModes[j].type == "modifier") &&
							(utils.findArray(newActiveModes, "name", config.customModes[j].name) == -1))
						{
							if((control[i].action == "start") ||
								((config.customModes[j].start != 0) &&
								(this.checkModeTriggers(future, config, config.customModes[j]))))
							{
								changed = true;
								newActiveModes.push(config.customModes[j]);
							}
						}
					}			
				}
			}
			else {
				if((modeName == "Current Mode") && (config.activeModes.length > 0))
					modeName = config.activeModes[0].name;
				else if((modeName == "Previous Mode") && (config.historyList.length > 0))
					modeName = config.historyList[0].name;

				var index = utils.findArray(config.customModes, "name", modeName);

				if((index != -1) && (index != 0)) {
					if(control[i].action == "close") {
						var index = utils.findArray(newActiveModes, "name", modeName);

						if(index != -1) {
							if(newActiveModes[index].type == "normal") {
								changed = true;
								newActiveModes.splice(0, 1, config.customModes[0]);
							}
							else if(newActiveModes[index].type == "modifier") {
								changed = true;
								newActiveModes.splice(index, 1);
							}
						}			
					}
					else if((control[i].action == "start") || ((control[i].action == "trigger") &&
							(config.customModes[index].start != 0) && 
							(this.checkModeTriggers(future, config, config.customModes[index]))))
					{
						if(config.customModes[index].type == "normal") {
							changed = true;
							newActiveModes.splice(0, 1, config.customModes[index]);
						}
						else if(config.customModes[index].type == "modifier") {
							if(utils.findArray(newActiveModes, "name", modeName) == -1) {
								changed = true;
								newActiveModes.push(config.customModes[index]);
							}
						}			
					}			
				}
			}
		}
	}

	if((changed) && (roundCount < 5))
		this.prepareModeChange(future, config, newActiveModes, "init", ++roundCount);
	else {
		if(roundCount == 5) {
			this.PalmCall.call("palm://com.palm.applicationManager/", "launch", {
				'id': "org.webosinternals.modeswitcher", 'params': {'action': "notify", 
					'notify': 5, 'name': "Current Mode", 'event': "error"}});
		}
		
		if(roundPhase == "init")
			this.executeModeChange(future, config, newActiveModes, "done", roundCount);
		else if(roundPhase == "done") {
			var newHistoryList = this.updateHistoryList(future, config, newActiveModes[0]);
			
			future.nest(prefs.save({
				modeLocked: lockedState,
				activeModes: newActiveModes, 
				historyList: newHistoryList}));
				
			future.then(this, function(future) {
				future.result = { returnValue: true };
			});
		}
	}
}

ExecuteCommandAssistant.prototype.executeModeChange = function(future, config, newActiveModes, roundPhase, roundCount) {
	console.error("Executing mode updating: exec " + roundCount);

	this.executeSettingsUpdate(future, config, config.activeModes, newActiveModes, 
		function(config, newActiveModes, roundPhase, roundCount, newFuture) {
			// When done updating the system settings then call apps update.
			
			this.executeAppsSrvsUpdate(newFuture, config, config.activeModes, newActiveModes, 
				function(config, newActiveModes, roundPhase, roundCount, newFuture) {
					// When done updating apps and srvs then call mode update.

					this.prepareModeChange(newFuture, config, newActiveModes, roundPhase, roundCount);
				}.bind(this, config, newActiveModes, roundPhase, roundCount)
			);
		}.bind(this, config, newActiveModes, roundPhase, roundCount, future)
	);
}

//

ExecuteCommandAssistant.prototype.executeSettingsUpdate = function(future, config, oldActiveModes, newActiveModes, doneCallback) {
	console.error("Applying current system settings");

	utils.asyncForEach(config.extensions.settings, 
		function(future, config, oldActiveModes, newActiveModes, item, next, newFuture) {
			var oldModeSettings = {'extension': item};
			var newModeSettings = {'extension': item};

			var modes = [config.customModes[0]].concat(newActiveModes);

			for(var j = 0; j < modes.length; j++) {
				var index = utils.findArray(modes[j].settings.list, "extension", item);

				if(index != -1)
					utils.extend(newModeSettings, modes[j].settings.list[index]);				
			}
		
			if((oldActiveModes.length > 0) && 
				((!config.preferences.settings[item]) || 
				(!config.preferences.settings[item].force))) 
			{
				var modes = [config.customModes[0]].concat(oldActiveModes);

				for(var j = 0; j < modes.length; j++) {
					var index = utils.findArray(modes[j].settings.list, "extension", item);

					if(index != -1)
						utils.extend(oldModeSettings, modes[j].settings.list[index]);
				}
			}

			console.error("Applying system settings: " + item);

			if(newFuture)
				future = newFuture;

			eval("future.nest(" + item + "Settings.update(oldModeSettings, newModeSettings));");
	
			future.then(this, function(future) {
				next(future);
			});
		}.bind(this, future, config, oldActiveModes, newActiveModes), doneCallback
	);
}

ExecuteCommandAssistant.prototype.executeAppsSrvsUpdate = function(future, config, oldActiveModes, newActiveModes, doneCallback) {  
	console.error("Updating applications and services");
	
	var closeAppsSrvs = new Array();
	var startAppsSrvs = new Array();

	var oldCloseAllStartedApps = false;
	var newCloseAllStartedApps = false;

	for(var i = 0; i < newActiveModes.length; i++) {
		if((newActiveModes[i].type != "default") || (newActiveModes[i].start == 0) ||
			(this.controller.args.startup))
		{
			if((utils.findArray(oldActiveModes, "name", newActiveModes[i].name) == -1) ||
				(this.controller.args.startup))
			{
				if(newActiveModes[i].appssrvs.start == 2)
					newCloseAllStartedApps = true;

				for(var j = 0; j < newActiveModes[i].appssrvs.list.length; j++) {
					if(newActiveModes[i].appssrvs.list[j].type == "ms")
						continue;

					if(config.extensions.appssrvs.indexOf(newActiveModes[i].appssrvs.list[j].extension) == -1)
						continue;

					if((this.controller.args.startup) && (newActiveModes[i].appssrvs.list[j].extension == "systools"))
						continue;
				
					if((newActiveModes[i].appssrvs.list[j].event == "start") ||
						(newActiveModes[i].appssrvs.list[j].event == "both"))
					{
						startAppsSrvs.push(newActiveModes[i].appssrvs.list[j]);
					}
				}
			}
		}
	}

	if(oldActiveModes) {
		for(var i = 0; i < oldActiveModes.length; i++) {
			if((utils.findArray(newActiveModes, "name", oldActiveModes[i].name) == -1))
			{
				if(oldActiveModes[i].appssrvs.close == 2)
					oldCloseAllStartedApps = true;

				for(var j = 0; j < oldActiveModes[i].appssrvs.list.length; j++) {
					if(oldActiveModes[i].appssrvs.list[j].type == "ms")
						continue;

					if(config.extensions.appssrvs.indexOf(oldActiveModes[i].appssrvs.list[j].extension) == -1)
						continue;

					if((this.controller.args.startup) && (newActiveModes[i].appssrvs.list[j].extension == "systools"))
						continue;

					if((oldActiveModes[i].appssrvs.list[j].event == "start") ||
						(oldActiveModes[i].appssrvs.list[j].event == "both"))
					{
						if((oldActiveModes[i].appssrvs.list[j].type == "app") &&
							(oldActiveModes[i].appssrvs.close == 1))
						{
							closeAppsSrvs.push(oldActiveModes[i].appssrvs.list[j]);
						}
					}
				
					if((oldActiveModes[i].appssrvs.list[j].event == "close") ||
						(oldActiveModes[i].appssrvs.list[j].event == "both"))
					{
						if((oldActiveModes[i].appssrvs.list[j].type == "app") && 
							(!newCloseAllStartedApps)) 
						{
							startAppsSrvs.push(oldActiveModes[i].appssrvs.list[j]);
						}
						else if(oldActiveModes[i].appssrvs.list[j].type == "srv")
						{
							closeAppsSrvs.push(oldActiveModes[i].appssrvs.list[j]);
						}
					}
				}
			}
		}
	}

	if((oldCloseAllStartedApps) || (newCloseAllStartedApps))
		closeAppsSrvs = "all";

	future.nest(apps.update(closeAppsSrvs, startAppsSrvs));
	
	future.then(this, function(future) {
		doneCallback(future);
	});
}

//

ExecuteCommandAssistant.prototype.updateHistoryList = function(future, config, newActiveMode) {  
	console.error("Updating mode history list config");

	// Add to list if this is a new mode if already last in the list then remove.

	if(config.activeModes.length > 0) {
		if((config.activeModes[0].type != "default") && 
			(config.activeModes[0].name != newActiveMode.name))
		{
			if(config.historyList.length == 0)
				config.historyList.push({'name': config.activeModes[0].name});
			else {
				config.historyList.unshift({'name': config.activeModes[0].name});

				if(config.historyList.length > 10)
					config.historyList.splice(10, 1);
			}
		}
		else if((config.historyList.length > 0) && 
			(config.historyList[0].name == newActiveMode.name))
		{
				config.historyList.shift();
		}
	}
	
	return config.historyList;
}

