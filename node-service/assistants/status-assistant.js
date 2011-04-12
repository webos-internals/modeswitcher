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
	});
}

StatusCommandAssistant.prototype.cleanup = function() {  
	prefs.delSubscription(this.id);
}

