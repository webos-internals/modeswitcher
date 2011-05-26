var utils = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
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
	
	that.futureLoop = function(future, array, iterator, done) {
		function loop(i, future) {
			if (i < array.length) {
				iterator(array[i], function(future) {
					loop(i + 1, future);
				}, future);
			}
			else {
				done(future);
			}
		}
		
		if(!array)
			done(future);
		else
			loop(0, future);
	};
	
	return that;
}());
