var prefs = (function() {
	var that = {};

	var Foundations = IMPORTS.foundations;

	var DB = Foundations.Data.DB;

	var DB_KIND = "org.webosinternals.modeswitcher:1";
	
	var subscriptions = {};
	
	var defaultPrefs = function() {
		return {
			_kind: DB_KIND,
			activated: false,
			modeLocked: false,
			apiVersion: "2.0",
			cfgVersion: "2.0",
			startTimer: 10000,
			closeTimer: 10000,
			historyList: [],
			activeModes: [],
			customModes: [],
			extensions: {
				appssrvs: [], 
				settings: [], 
				triggers: []},
			statusData: {
				appssrvs: {}, 
				settings: {},
				triggers: {}}
		};
	};

//

	var initPrefs = function() {
		var future = DB.putKind(DB_KIND, "org.webosinternals.modeswitcher", []);
		
		future.then(this, function(future) {
			future.result = { returnValue: true };
		});
			
		return future;
	};

	var loadPrefs = function() {
		var future = DB.find({ from: DB_KIND, limit: 2 });

		future.then(this, function(future) {
			var result = future.result;
			
			var len = result.results ? result.results.length : 0;
			
			if (len === 0)
				future.result = defaultPrefs();
			else if (len > 1)
				throw new Error("More than 1 preferences object found");
			else
				future.result = result.results[0];
		});

		return future;
	};

	var savePrefs = function(prefs) {
		var future = DB.put([prefs]);

		future.then(this, function(future) {
			var result = future.result;
		
//			if(result.returnValue === true)
				future.result = { returnValue: true };
		/*	else {
				future.nest(loadPrefs());
					
				future.then(this, function(future) {
					var result = future.result;

					//if(result._rev != newPrefs._rev) {
						updatePrefs(result, prefs);
					
						future.nest(savePrefs(result));
						
						future.then(this, function(future) {
							future.result = { returnValue: true };
						});
					//}
					//else
						//future.result = { returnValue: false };
				});
			}*/
		});

		return future;
	};

//

	var updatePrefs = function(oldPrefs, newPrefs) {
		if(newPrefs.activated != undefined)
			oldPrefs.activated = newPrefs.activated;
		
		if(newPrefs.modeLocked != undefined)
			oldPrefs.modeLocked = newPrefs.modeLocked;
		
		if(newPrefs.apiVersion != undefined)
			oldPrefs.apiVersion = newPrefs.apiVersion;

		if(newPrefs.cfgVersion != undefined)
			oldPrefs.cfgVersion = newPrefs.cfgVersion;

		if(newPrefs.startTimer != undefined)
			oldPrefs.startTimer = newPrefs.startTimer;

		if(newPrefs.closeTimer != undefined)
			oldPrefs.closeTimer = newPrefs.closeTimer;

		if(newPrefs.historyList != undefined)
			oldPrefs.historyList = newPrefs.historyList;

		if(newPrefs.activeModes != undefined)
			oldPrefs.activeModes = newPrefs.activeModes;

		if(newPrefs.customModes != undefined)
			oldPrefs.customModes = newPrefs.customModes;

		if(newPrefs.extensions != undefined) {
			if(newPrefs.extensions.appssrvs != undefined)
				oldPrefs.extensions.appssrvs = newPrefs.extensions.appssrvs;

			if(newPrefs.extensions.settings != undefined)
				oldPrefs.extensions.settings = newPrefs.extensions.settings;

			if(newPrefs.extensions.triggers != undefined)
				oldPrefs.extensions.triggers = newPrefs.extensions.triggers;
		}

		if(newPrefs.statusData != undefined) {
			if(newPrefs.statusData.appssrvs != undefined) {
				for(var ext in newPrefs.statusData.appssrvs) {
					oldPrefs.statusData.appssrvs[ext] = newPrefs.statusData.appssrvs[ext];
				}
			}

			if(newPrefs.statusData.settings != undefined) {
				for(var ext in newPrefs.statusData.settings) {
					oldPrefs.statusData.settings[ext] = newPrefs.statusData.settings[ext];
				}
			}

			if(newPrefs.statusData.triggers != undefined) {
				for(var ext in newPrefs.statusData.triggers) {
					oldPrefs.statusData.triggers[ext] = newPrefs.statusData.triggers[ext];
				}
			}
		}
	};
	
	var upgradePrefs = function(curPrefs, newVersion) {
		if(curPrefs.cfgVersion != newVersion)
			console.log("Mode Switcher old preferences");
	};

//

	var notifySubscribers = function(prefs) {
		for(var id in subscriptions) {
			var notifyKeys = null;

			for(var key in prefs) {
				if(subscriptions[id].keys.indexOf(key) != -1) {
					if(!notifyKeys)
						notifyKeys = {};
				
					notifyKeys[key] = prefs[key];
				}
			}

			if(notifyKeys) {
				var future = subscriptions[id].factory.get();
				
				future.result = notifyKeys;
			}
		}
	};

// Public functions...

	that.init = function() {
		return initPrefs();
	};

	that.load = function() {
		var future = loadPrefs();
		
		future.then(this, function(future) {
			console.log("Mode Switcher preferences loaded");

			var result = future.result;

			upgradePrefs(result, "2.0");

// FIXME: temp override

			result.extensions.appssrvs = ["browser", "default", "govnah", "modesw", "phone", "systools"];
			result.extensions.settings = ["airplane", "calendar", "connection", "email", "messaging", "network", "ringer", "screen", "security", "sound"];
			result.extensions.triggers = ["application", "battery", "bluetooth", "calevent", "charger", "display", "headset", "interval", "location", "modechange", "silentsw", "timeofday", "wireless"];
		
			future.result = result;
		});
		
		return future;
	};

	that.save = function(prefs) {
		var future = loadPrefs(future);
		
		future.then(this, function(future) {
			var result = future.result;

			updatePrefs(result, prefs);
			
			future.nest(savePrefs(result));
			
			future.then(this, function(future) {
				console.log("Mode Switcher preferences saved");

				notifySubscribers(prefs);

				future.result = { returnValue: true };
			});
		});

		return future;
	};

//
	
	that.addSubscription = function(id, keys, factory) {
		subscriptions[id] = {'keys': keys, 'factory': factory};
	};

	that.delSubscription = function(id) {
		if(subscriptions[id])
			delete subscriptions[id];
	};

	return that;
}());

