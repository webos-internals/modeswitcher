var PrefsCommandAssistant = function() {
}

//

PrefsCommandAssistant.prototype.setup = function() {  
}

PrefsCommandAssistant.prototype.run = function(future) {  
	if(this.controller.args.keys) {
		future.nest(prefs.load());
	
		future.then(this, function(future) {
			var curConfig = future.result;
		
			// TODO: include only requested prefs...

			future.result = {
				activated: curConfig.activated,
				modeLocked: curConfig.modeLocked,
				
				startTimer: curConfig.startTimer, 
				closeTimer: curConfig.closeTimer, 
				activeModes: curConfig.activeModes,
				customModes: curConfig.customModes,
				extensions: curConfig.extensions };
		});
	}
	else {
		var newConfig = {};
		
		if(this.controller.args.startTimer != undefined)
			newConfig.startTimer = this.controller.args.startTimer;

		if(this.controller.args.closeTimer != undefined)
			newConfig.closeTimer = this.controller.args.closeTimer;

		if(this.controller.args.modeLocked != undefined)
			newConfig.modeLocked = this.controller.args.modeLocked;

		if(this.controller.args.activeModes != undefined)
			newConfig.activeModes = this.controller.args.activeModes;

		if(this.controller.args.customModes != undefined)
			newConfig.customModes = this.controller.args.customModes;

		if(this.controller.args.extensions != undefined)
			newConfig.extensions = this.controller.args.extensions;
	
		future.nest(prefs.save(newConfig));

		future.then(this, function(future) {
			future.result = { returnValue: true };
		});
	}
}

PrefsCommandAssistant.prototype.cleanup = function() {  
}

