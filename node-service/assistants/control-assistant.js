var ControlCommandAssistant = function() {
	this.Foundations = IMPORTS.foundations;

	this.PalmCall = this.Foundations.Comms.PalmCall;
}

//

ControlCommandAssistant.prototype.setup = function() {  
}

ControlCommandAssistant.prototype.run = function(future) {
	console.error("MS - Control - Run - " + JSON.stringify(this.controller.args));
  
	future.nest(prefs.load());
	
	future.then(this, function(future) {
		var config = future.result;

		if(config.activated == true) {
			if(this.controller.args.action == "startup")
				this.startupModeSwitcher(future, config);
			else if(this.controller.args.action == "enable")
				future.result = { returnValue: false, errorText: "Already activated" };
			else if(this.controller.args.action == "disable")
				this.disableModeSwitcher(future, config);
			else if(this.controller.args.action == "reload")
				this.reloadModeSwitcher(future, config);
			else if(this.controller.args.action == "lock")
				this.lockModeSwitcher(future, config);
			else if(this.controller.args.action == "unlock")
				this.unlockModeSwitcher(future, config);
			else 
				future.result = { returnValue: false, errorText: "Unknown Command" };
		}
		else {
			if(this.controller.args.action == "enable")
				this.enableModeSwitcher(future, config);
			else if(this.controller.args.action == "disable")
				future.result = { returnValue: false, errorText: "Not activated" };
			else if(this.controller.args.action == "reload")
				future.result = { returnValue: false, errorText: "Not activated" };
			else if(this.controller.args.action == "lock")
				future.result = { returnValue: false, errorText: "Not activated" };
			else if(this.controller.args.action == "unlock")
				future.result = { returnValue: false, errorText: "Not activated" };
			else if(this.controller.args.action == "startup")
				future.result = { returnValue: false, errorText: "Not activated" };
			else 
				future.result = { returnValue: false, errorText: "Unknown Command"  };
		}
	});
}

ControlCommandAssistant.prototype.cleanup = function() {  
}

//

ControlCommandAssistant.prototype.startupModeSwitcher = function(future, config) {  
	console.error("MS - Control - Startup - " + config.customModes[0].startup);
	
	utils.asyncForEach(config.extensions.triggers, 
		function(future, config, item, next, newFuture) {
			if(newFuture)
				future = newFuture;
			
			if(!config.statusData.triggers[item])	
				config.statusData.triggers[item] = {};
			
			var configData = config.statusData.triggers[item];

			var triggersData = [];

			for(var i = 0; i < config.customModes.length; i++) {
				for(var j = 0; j < config.customModes[i].triggers.length; j++) {
					for(var k = 0; k < config.customModes[i].triggers[j].list.length; k++) {
						if(config.customModes[i].triggers[j].list[k].extension == item)
							triggersData.push(config.customModes[i].triggers[j].list[k]);
					}
				}
			}				
			
			// Do shutdown for luna restarts (would otherwise not be needed)
			
			console.error("Re-initializing trigger extension: " + item);
			
			eval("future.nest(" + item + "Triggers.shutdown(configData));");
			
			future.then(this, function(future) {
				eval("future.nest(" + item + "Triggers.initialize(configData, triggersData));");

				future.then(this, function(future) {
					next(future);
				});
			});
		}.bind(this, future, config),
		function(future, config, newFuture) {
			if(newFuture)
				future = newFuture;
			
			var newConfig = {
				modeLocked: false,
				historyList: [],
				statusData: config.statusData
			};

			future.nest(prefs.save(newConfig));

			future.then(this, function(future) {
				if(config.customModes[0].startup == 0) {
					future.nest(this.PalmCall.call("palm://org.webosinternals.modeswitcher.srv", "execute", {
						'action': "reload", 'name': "Current Mode", 'startup': true}));
				}
				else{
					future.nest(this.PalmCall.call("palm://org.webosinternals.modeswitcher.srv", "execute", {
						'action': "start", 'name': "Default Mode", 'startup': true}));
				}

				future.then(this, function(future) {
					future.result = { returnValue: true };
				});
			});
		}.bind(this, future, config)
	);
}

ControlCommandAssistant.prototype.enableModeSwitcher = function(future, config) {  
	console.error("MS - Control - Enable");
	
	utils.asyncForEach(config.extensions.triggers, 
		function(future, config, item, next, newFuture) {
			if(newFuture)
				future = newFuture;
			
			if(!config.statusData.triggers[item])	
				config.statusData.triggers[item] = {};
			
			var configData = config.statusData.triggers[item];

			var triggersData = [];

			for(var i = 0; i < config.customModes.length; i++) {
				for(var j = 0; j < config.customModes[i].triggers.length; j++) {
					for(var k = 0; k < config.customModes[i].triggers[j].list.length; k++) {
						if(config.customModes[i].triggers[j].list[k].extension == item)
							triggersData.push(config.customModes[i].triggers[j].list[k]);
					}
				}
			}				
			
			console.error("Initializing trigger extension: " + item);
			
			eval("future.nest(" + item + "Triggers.initialize(configData, triggersData));");

			future.then(this, function(future) {
				next(future);
			});
		}.bind(this, future, config),
		function(future, config, newFuture) {
			if(newFuture)
				future = newFuture;
			
			var newConfig = {
				activated: true,
				modeLocked: false,
				
				activeModes: [],
				historyList: [],
				
				statusData: config.statusData
			};

			future.nest(prefs.save(newConfig));

			future.then(this, function(future) {
				future.result = { returnValue: true };
			});
		}.bind(this, future, config)
	);
}

ControlCommandAssistant.prototype.disableModeSwitcher = function(future, config) {  
	console.error("MS - Control - Disable");
	
	utils.asyncForEach(config.extensions.triggers, 
		function(future, config, item, next, newFuture) {
			if(newFuture)
				future = newFuture;
						
			if(!config.statusData.triggers[item])	
				config.statusData.triggers[item] = {};

			var configData = config.statusData.triggers[item];

			console.error("Uninitializing trigger extension: " + item);
			
			eval("future.nest(" + item + "Triggers.shutdown(configData));");
	
			future.then(this, function(future) {
				next(future);
			});
		}.bind(this, future, config),
		function(future, config, newFuture) {
			if(newFuture)
				future = newFuture;
			
			var newConfig = {
				activated: false,
				modeLocked: false,
				
				activeModes: [],
				historyList: [],
				
				statusData: config.statusData
			};

			future.nest(prefs.save(newConfig));

			future.then(this, function(future) {
				future.result = { returnValue: true };
			});
		}.bind(this, future, config)
	);
}

ControlCommandAssistant.prototype.reloadModeSwitcher = function(future, config) {  
	console.error("MS - Control - Reload");
	
	utils.asyncForEach(config.extensions.triggers, 
		function(future, config, item, next, newFuture) {
			if(newFuture)
				future = newFuture;
						
			if(!config.statusData.triggers[item])	
				config.statusData.triggers[item] = {};

			var configData = config.statusData.triggers[item];

			var triggersData = [];
			
			for(var i = 0; i < config.customModes.length; i++) {
				for(var j = 0; j < config.customModes[i].triggers.length; j++) {
					for(var k = 0; k < config.customModes[i].triggers[j].list.length; k++) {
						if(config.customModes[i].triggers[j].list[k].extension == item)
							triggersData.push(config.customModes[i].triggers[j].list[k]);
					}
				}
			}				

			console.error("Re-initializing trigger extension: " + item);

			eval("future.nest(" + item + "Triggers.shutdown(configData));");
	
			future.then(this, function(future) {
				eval("future.nest(" + item + "Triggers.initialize(configData, triggersData));");

				future.then(this, function(future) {
					next(future);
				});
			});
		}.bind(this, future, config),
		function(future, config, newFuture) {
			if(newFuture)
				future = newFuture;

			var newConfig = {
				statusData: config.statusData
			}

			future.nest(prefs.save(newConfig));

			future.then(this, function(future) {
				future.nest(this.PalmCall.call("palm://org.webosinternals.modeswitcher.srv", "execute", {
					'action': "reload", 'name': "Current Mode"}));

				future.then(this, function(future) {
					future.result = { returnValue: true };
				});
			});
		}.bind(this, future, config));
}

ControlCommandAssistant.prototype.lockModeSwitcher = function(future, config) {  
	console.error("MS - Control - Lock");
	
	future.nest(prefs.save({modeLocked: true}));

	future.then(this, function(future) {
		future.result = { returnValue: true };
	});
}

ControlCommandAssistant.prototype.unlockModeSwitcher = function(future, config) {  
	console.error("MS - Control - Unlock");
	
	future.nest(prefs.save({modeLocked: false}));

	future.then(this, function(future) {
		future.result = { returnValue: true };
	});
}

