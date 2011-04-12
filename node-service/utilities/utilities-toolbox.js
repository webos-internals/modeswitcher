var utils = (function() {
	var that = {};

	var Foundations = IMPORTS.foundations;

	var PalmCall = Foundations.Comms.PalmCall;

	that.display = function(state) {
		// TODO
	
	//	if(this.config.currentMode.settings.charging == 1)
//		DisplayControlWrapper.setMode("default");
//	else if(this.config.currentMode.settings.charging == 2)
//		DisplayControlWrapper.setMode("alwayson");
//	else if(this.config.currentMode.settings.charging == 3)
//		DisplayControlWrapper.setMode("turnoff");
	
	};

	that.notify = function(alert, notify, mode, event) {
		if((mode) && (notify == 2)) {
			PalmCall.call("palm://com.palm.applicationManager/", "launch", {
				'id': "org.webosinternals.modeswitcher", 'params': {
					'action': "notify", 'alert': alert, 'event': event, 'name': mode}});
		}
		else if((event == "reload") || (event == "update")) {
			PalmCall.call("palm://com.palm.applicationManager/", "launch", {
				'id': "org.webosinternals.modeswitcher", 'params': {
					'action': "notify", 'alert': alert, 'event': event, 'name': "none"}});
		}
		else if((mode) && (notify == 1)) {
			PalmCall.call("palm://com.palm.applicationManager/", "launch", {
				'id': "org.webosinternals.modeswitcher", 'params': {
					'action': "notify", 'alert': alert, 'event': "none", 'name': mode}});
		}
	};

	that.extend = function(targetObject, sourceObject) {
		for(key in sourceObject) {
			if(typeof(sourceObject[key]) == 'object') {
				if(!targetObject[key])
					targetObject[key] = {};
			
				that.extend(targetObject[key], sourceObject[key]);
			}
			else
				targetObject[key] = sourceObject[key];
		}
	};

	that.findArray = function(array, key, value) {
		// Finds object from an array based on given key and value.

		if(!array)
			return -1;

		for(var i = 0; i < array.length; i++) {
		  if(array[i][key] == value)
		    return i;
		}

		return -1;    
	};
	
	that.asyncForEach = function(array, iterator, done) {
		function loop(i, data) {
			if (i < array.length) {
				iterator(array[i], function(data) {
					loop(i + 1, data);
				}, data);
			}
			else {
				done(data);
			}
		}
		if(!array)
			done();
		else
			loop(0);
	};
	
	return that;
}());

