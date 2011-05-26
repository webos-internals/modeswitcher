/*
	Contacts Configuration Object:
	
	databaseId:				string,
	blockedNumbers:		boolean,
	unknownNumbers:		boolean
*/

var contactsSettings = (function() {
	var that = {};
	
	var Foundations = IMPORTS.foundations;
	
	var Future = Foundations.Control.Future;
	
	var PalmCall = Foundations.Comms.PalmCall;
	
//
	
	var settingsUpdate = function(settingsOld, settingsNew, item) {
		var future = new Future();
		
		if(item == "contacts") {
			var params = {};
			
			if(settingsNew.databaseId != undefined) {
				params._id = settingsNew.databaseId;
				
				if((settingsNew.blockedNumbers != undefined) && (settingsOld.blockedNumbers != settingsNew.blockedNumbers))
					params.blockedNumbers = settingsNew.blockedNumbers;
				
				if((settingsNew.unknownNumbers != undefined) && (settingsOld.unknownNumbers != settingsNew.unknownNumbers))
					params.unknownNumbers = settingsNew.unknownNumbers;
			}
			
			if((params.blockedNumbers != undefined) || (params.unknownNumbers != undefined)) {
				future.nest(PalmCall.call("palm://org.webosinternals.modeswitcher.sys/", "systemCall", {
					'id': "com.palm.app.contacts", 'service': "com.palm.db", 
					'method': "merge", 'params': {'objects': [params]}}));
				
				future.then(this, function(future) { future.result = { returnValue: true }; });
			}
			else
				future.result = { returnValue: true }; 
		}
		
		return future;
	};
	
//
	
	that.update = function(settingsOld, settingsNew) {
		var future = new Future();
		
		future.nest(utils.futureLoop(["contacts"], 
			settingsUpdate.bind(this, settingsOld, settingsNew)));
		
		future.then(this, function(future) { 
			future.result = { returnValue: true }; 
		});
				
		return future;
	};
	
	return that;
}());
