var utils = (function() {
	var that = {};

	var Foundations = IMPORTS.foundations;

	var PalmCall = Foundations.Comms.PalmCall;

	that.notify = function(notify, mode, event) {
		PalmCall.call("palm://com.palm.applicationManager/", "launch", {
			'id': "org.webosinternals.modeswitcher", 'params': {'action': "notify", 
				'notify': notify, 'name': mode, 'event': event}});
	};

	that.extend = function(targetObject, sourceObject) {
		for(key in sourceObject) {
			if(typeof(sourceObject[key]) == 'object') {
				if (sourceObject[key] instanceof Object[]) {
				console.error("AAA array");
					targetObject[key] = sourceObject[key].slice(0);
				}
				else {
				console.error("AAA object");
					if(!targetObject[key])
						targetObject[key] = {};
		
					that.extend(targetObject[key], sourceObject[key]);
				}
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

