function GdmAssistant(action, item, filter, data, callback) {
	this.action = action;

	this.item = item;
	
	this.filter = filter;

	this.data = data;

	this.callback = callback;

	this.viewLevel = 0;
}

//

GdmAssistant.prototype.setup = function() {
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true},
		{visible: true, items: [{label: $L("Help"), command: 'help'}]});

	if(this.action == "importGDoc") {
		this.controller.get('import').show();

		this.controller.get('ImportTitle1').update("Import " + this.item);
		this.controller.get('ImportTitle2').update("Import " + this.item);
	}		
	else if(this.action == "exportGDoc") {
		this.controller.get('export').show();

		this.controller.get('ExportTitle').update("Export " + this.item);
	}
	else if(this.action == "pickLocation")
		this.controller.get('mapview').show();
		
	// IMPORT
	
	this.modelImportGDMatch = {value: "", disabled: false};
	
	this.controller.setupWidget("ImportGDMatch", {'hintText': $L("Match words..."), 
		'multiline': false, 'enterSubmits': false, 'focus': true},
		this.modelImportGDMatch); 

	this.modelImportGDShare = {value: false, disabled: false};

	this.controller.setupWidget("ImportGDShared", {'trueLabel': $L("Yes"), 'falseLabel': $L("No")},
		this.modelImportGDShare); 

	this.modelImportGDOrdering = {'value': "title", 'disabled': false};
	
	this.defaultChoicesImportGDOrdering = [
		{'label': $L("Title"), 'value': "title"},
		{'label': $L("Last Modified"), 'value': "last-modified"}];  
		
	this.controller.setupWidget("ImportGDOrdering", {'label': $L("Order By"), 
		'labelPlacement': "left", 'choices': this.defaultChoicesImportGDOrdering}, 
		this.modelImportGDOrdering);
				
	this.modelImportGDUsername = {value: "", disabled: false};
	
	this.controller.setupWidget("ImportGDUsername", {'hintText': $L("Google Docs email..."), 
		'multiline': false, 'enterSubmits': false, 'focus': false, 'textCase': Mojo.Widget.steModeLowerCase},
		this.modelImportGDUsername); 

	this.modelImportGDPassword = {value: "", disabled: false};
	
	this.controller.setupWidget("ImportGDPassword", {'hintText': $L("Google Docs password..."), 
		'multiline': false, 'enterSubmits': false, 'focus': false, 'textCase': Mojo.Widget.steModeLowerCase},
		this.modelImportGDPassword); 

	this.modelImportGDList = {'items': []};

	this.controller.setupWidget("ImportGDList", {
		'itemTemplate': 'templates/gdocs-item',
		'swipeToDelete': false, 'reorderable': false,
		'autoconfirmDelete': true},
		this.modelImportGDList);
	
	this.handlerImportModeData = this.importDocumentData.bindAsEventListener(this);
	
	this.controller.listen(this.controller.get("ImportGDList"), Mojo.Event.listTap, 
		this.handlerImportModeData);

	this.modelImportGDButton = {buttonClass: '', disabled: false};

	this.controller.setupWidget('ImportGDButton', {label: $L("List " + this.item)}, this.modelImportGDButton);
	
	this.controller.listen(this.controller.get('ImportGDButton'), Mojo.Event.tap, 
		this.listGoogleDocuments.bind(this));
			
	// EXPORT
	
	this.modelExportGDTitle = {value: "", disabled: false};
		
	this.controller.setupWidget("ExportGDTitle", {'hintText': $L("Descriptive document name..."), 
		'multiline': false, 'enterSubmits': false, 'focus': true},
		this.modelExportGDTitle); 

	this.modelExportGDDesc = {value: "", disabled: false};
	
	this.controller.setupWidget("ExportGDDesc", {'hintText': $L("Short document description..."), 
		'multiline': false, 'enterSubmits': false, 'focus': false},
		this.modelExportGDDesc); 

	this.modelExportGDUsername = {value: "", disabled: false};
	
	this.controller.setupWidget("ExportGDUsername", {'hintText': $L("Google Docs email..."), 
		'multiline': false, 'enterSubmits': false, 'focus': false, 'textCase': Mojo.Widget.steModeLowerCase},
		this.modelExportGDUsername); 

	this.modelExportGDPassword = {value: "", disabled: false};
	
	this.controller.setupWidget("ExportGDPassword", {'hintText': $L("Google Docs password..."), 
		'multiline': false, 'enterSubmits': false, 'focus': false, 'textCase': Mojo.Widget.steModeLowerCase},
		this.modelExportGDPassword); 

	this.modelExportGDShare = {value: false, disabled: false};

	this.controller.setupWidget("ExportGDShare", {'trueLabel': $L("Yes"), 'falseLabel': $L("No")},
		this.modelExportGDShare); 
			
	this.modelExportGDButton = {buttonClass: '', disabled: false};

	this.controller.setupWidget('ExportGDButton', {label: $L("Export ") + this.item}, this.modelExportGDButton);
	
	this.controller.listen(this.controller.get('ExportGDButton'), Mojo.Event.tap, 
		this.exportDocumentData.bind(this)); 

	// MAP VIEW
	
	this.modelMapViewAddress = {value: "", disabled: false};
		
	this.controller.setupWidget("MapViewAddress", {'hintText': $L("Enter street address..."), 
		'multiline': false, 'enterSubmits': false, 'requiresEnterKey': true, 'focus': true},
		this.modelMapViewAddress); 

	this.controller.listen(this.controller.get('MapViewAddress'), Mojo.Event.propertyChange, 
		this.updateMapLocation.bind(this));

	if(this.action == "pickLocation") {
		Mojo.loadScriptWithCallback("http://maps.google.com/maps/api/js?sensor=false&callback=googleMapsLoaded", null);

		this.itemsCommandMenu = [
			{'label': "- " + $L("Zoom"), 'command': "zoom_out"},
			{'width': 5},
			{'label': $L("Done"), 'command': "done", 'width': 100},
			{'width': 5},
			{'label': $L("Zoom") + " +", 'command': "zoom_in"} ];
	
		this.modelCommandMenu = {'visible': true, 'items': this.itemsCommandMenu};
		
		this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'}, this.modelCommandMenu);
	}
}

//

GdmAssistant.prototype.listGoogleDocuments = function(event) {
	var match = this.filter;

	if(this.modelImportGDMatch.value.length > 0)
		match += "+" + this.modelImportGDMatch.value.replace(" ", "+");
	
	var order = "orderby=" + this.modelImportGDOrdering.value;
	
	var private = "/-/private";
	
	if(this.modelImportGDShare.value)
		private = "";
	
	this.modelImportGDButton.disabled = true;

	this.controller.modelChanged(this.modelImportGDButton, this);

	new Ajax.Request("https://www.google.com/accounts/ClientLogin?accountType=HOSTED_OR_GOOGLE&Email=" + this.modelImportGDUsername.value + "&Passwd=" + encodeURIComponent(this.modelImportGDPassword.value) + "&service=writely&source=ModeSwitcher", {
		method: "post",
		onSuccess: function(response) { 
			var auth = response.responseText.split("\n")[2].split("=")[1];

			new Ajax.Request("http://docs.google.com/feeds/documents/private/full" + private + "?alt=json&title=" + match + "&" + order, {
				method: "get",
				contentType: "application/atom+xml",
				evalJSON: true,
				encoding: null,
				requestHeaders: {
					"GData-Version": "2.0",
					"Authorization": "GoogleLogin auth=" + auth
				},
				onSuccess: function(response) {
					var data = null;

					try {	data = Mojo.parseJSON(response.responseText); } catch (e) { }

					this.modelImportGDList.items.clear();

					if((data) && (data.feed) && (data.feed.entry)) {
						for(var i = 0; i < data.feed.entry.length; i++) {
							var info = data.feed.entry[i].title['$t'].split(" - ");

							this.modelImportGDList.items.push({'label': info[1], 'desc': info[2], 'value': data.feed.entry[i].id['$t']});
						}

						this.viewLevel = 1;

						this.controller.get('import').hide();
						this.controller.get('import-list').show();
						
						this.controller.modelChanged(this.modelImportGDList, this);
					}
					else {
						this.controller.showAlertDialog({
							title: $L("Unable to list documents!"),
							message: "<div align='justify'>" + $L("No documents matching the query.") + "</div>",
							choices:[{label:$L("OK"), value:"ok", type:'default'}],
							preventCancel: true,
							allowHTMLMessage: true}); 
					}

					this.modelImportGDButton.disabled = false;

					this.controller.modelChanged(this.modelImportGDButton, this);
				}.bind(this),
				onFailure: function(response) { 
					this.controller.showAlertDialog({
							title: $L("Unable to list documents!"),
							message: "<div align='justify'>" + $L("Failed to receive documents list from Google Docs.") + "</div>",
							choices:[{label:$L("OK"), value:"ok", type:'default'}],
							preventCancel: true,
							allowHTMLMessage: true});  

					this.modelImportGDButton.disabled = false;

					this.controller.modelChanged(this.modelImportGDButton, this);
				}.bind(this)
			});
		}.bind(this),
		onFailure: function(response) { 
			this.controller.showAlertDialog({
				title: $L("Unable to login!"),
				message: "<div align='justify'>" + $L("Login to Google Docs failed, please check your username and password.") + "</div>",
				choices:[{label:$L("OK"), value:"ok", type:'default'}],
				preventCancel: true,
				allowHTMLMessage: true}); 

			this.modelImportGDButton.disabled = false;

			this.controller.modelChanged(this.modelImportGDButton, this);
		}.bind(this)
	});  
}

GdmAssistant.prototype.importDocumentData = function(event) {
	this.controller.stopListening(this.controller.get("ImportGDList"), Mojo.Event.listTap, 
		this.handlerImportModeData);

	var url = event.item.value.replace("documents/private/full/document%3A", "download/documents/Export?docID=");

	new Ajax.Request("https://www.google.com/accounts/ClientLogin?accountType=HOSTED_OR_GOOGLE&Email=" + this.modelImportGDUsername.value + "&Passwd=" + encodeURIComponent(this.modelImportGDPassword.value) + "&service=writely&source=ModeSwitcher", {
		method: "post",
		onSuccess: function(response) { 
			var auth = response.responseText.split("\n")[2].split("=")[1];
			
			new Ajax.Request(url + "&exportFormat=txt", {
				method: "get",
				contentType: "text/plain",
				evalJSON: true,
				encoding: null,
				requestHeaders: {
					"GData-Version": "2.0",
					"Authorization": "GoogleLogin auth=" + auth
				},
				onSuccess: function(response) {
					var data = null;

					try {data = Mojo.parseJSON(response.responseText);} catch (e) {}

					if(data) {
						this.controller.showAlertDialog({
							title: $L("Download succesful!"),
							message: "<div align='justify'>" + $L("Downloading from Google Docs was succesful.") + "</div>",
							choices:[{label:$L("OK"), value:"ok", type:'default'}],
							preventCancel: true,
							allowHTMLMessage: true,
							onChoose: function(data, value) {
								if(this.callback)
									this.callback(data);	

								this.controller.stageController.popScene();
							}.bind(this, data)});
					}
					else {
						this.controller.showAlertDialog({
							title: $L("Invalid JSON data received!"),
							message: "<div align='justify'>" + $L("The received document data was not in proper JSON format.") + "</div>",
							choices:[{label:$L("OK"), value:"ok", type:'default'}],
							preventCancel: true,
							allowHTMLMessage: true}); 
					}
				}.bind(this),
				onFailure: function(response) { 
					this.controller.showAlertDialog({
						title: $L("Unable to download!"),
						message: "<div align='justify'>" + $L("Downloading from Google Docs failed, please try again later.") + "</div>",
						choices:[{label:$L("OK"), value:"ok", type:'default'}],
						preventCancel: true,
						allowHTMLMessage: true}); 
				}.bind(this)
			});
		}.bind(this),
		onFailure: function(response) { 
			this.controller.showAlertDialog({
				title: $L("Unable to login!"),
				message: "<div align='justify'>" + $L("Login to Google Docs failed, please check your username and password.") + "</div>",
				choices:[{label:$L("OK"), value:"ok", type:'default'}],
				preventCancel: true,
				allowHTMLMessage: true}); 
		}.bind(this)
	});  
}

GdmAssistant.prototype.exportDocumentData = function(event) {
	this.modelExportGDButton.disabled = true;
	
	this.controller.modelChanged(this.modelExportGDButton, this);

	var docData = Object.toJSON(this.data);

	if(this.modelExportGDTitle.value.length > 0)
		var docName = encodeURIComponent(this.modelExportGDTitle.value.replace("/", "_").replace("-", "_"));
	else
		var docName = "Exported Document";

	if(this.modelExportGDDesc.value.length > 0)
		var docDesc = encodeURIComponent(this.modelExportGDDesc.value.replace("/", "_").replace("-", "_"));
	else
		var docDesc = "No description";

	new Ajax.Request("https://www.google.com/accounts/ClientLogin?accountType=HOSTED_OR_GOOGLE&Email=" + this.modelExportGDUsername.value + "&Passwd=" + encodeURIComponent(this.modelExportGDPassword.value) + "&service=writely&source=ModeSwitcher", {
		method: "post",
		onSuccess: function(response) { 
			var auth = response.responseText.split("\n")[2].split("=")[1];

			new Ajax.Request("http://docs.google.com/feeds/documents/private/full?alt=json", {
				method: "post",
				contentType: "text/plain",
				postBody: docData,
				evalJSON: true,
				encoding: null,
				requestHeaders: {
					"GData-Version": "2.0",
					"Content-Type": "text/plain",
					"Authorization": "GoogleLogin auth=" + auth,
					"Slug": this.filter + " - " + docName + " - " + docDesc
				},
				onSuccess: function(response) {
					if(this.modelExportGDShare.value) {
						var aclData = "<entry xmlns='http://www.w3.org/2005/Atom' xmlns:gAcl='http://schemas.google.com/acl/2007'><category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/acl/2007#accessRule'/><gAcl:role value='reader'/><gAcl:scope type='user' value='mode-switcher@googlegroups.com'/></entry>";

						var url = response.responseJSON.entry.id['$t'].replace("/documents", "/acl");

						new Ajax.Request(url, {
							method: "post",
							contentType: "application/atom+xml",
							postBody: aclData,
							encoding: null,
							requestHeaders: {
								"GData-Version": "2.0",
								"Content-Type": "application/atom+xml",
								"Authorization": "GoogleLogin auth=" + auth
							},
							onSuccess: function(response) {
								this.controller.showAlertDialog({
									title: $L("Sharing succesful!"),
									message: "<div align='justify'>" + $L("Sharing of Google Docs document was succesful.") + "</div>",
									choices:[{label:$L("OK"), value:"ok", type:'default'}],
									preventCancel: true,
									allowHTMLMessage: true,
									onChoose: function(value) {
										this.controller.stageController.popScene();										
									}.bind(this)});
							}.bind(this),
							onFailure: function(response) {
								this.controller.showAlertDialog({
									title: $L("Unable to share!"),
									message: "<div align='justify'>" + $L("Sharing of Google Docs document failed, please try again later.") + "</div>",
									choices:[{label:$L("OK"), value:"ok", type:'default'}],
									preventCancel: true,
									allowHTMLMessage: true}); 

								this.modelExportGDButton.disabled = false;
	
								this.controller.modelChanged(this.modelExportGDButton, this);
							}.bind(this)
						});
					}
					else {
						this.controller.showAlertDialog({
							title: $L("Upload Succesful!"),
							message: "<div align='justify'>" + $L("Uploading to Google Docs was succesful.") + "</div>",
							choices:[{label:$L("OK"), value:"ok", type:'default'}],
							preventCancel: true,
							allowHTMLMessage: true,
							onChoose: function(value) {
								this.controller.stageController.popScene();										
							}.bind(this)});
					}
				}.bind(this),
				onFailure: function(response) { 
					this.controller.showAlertDialog({
						title: $L("Unable to upload!"),
						message: "<div align='justify'>" + $L("Uploading to Google Docs failed, please try again later.") + "</div>",
						choices:[{label:$L("OK"), value:"ok", type:'default'}],
						preventCancel: true,
						allowHTMLMessage: true}); 

					this.modelExportGDButton.disabled = false;
	
					this.controller.modelChanged(this.modelExportGDButton, this);
				}.bind(this)
			});  
		}.bind(this),
		onFailure: function(response) { 
			Mojo.Log.error("Login to Google Docs failed: " + response.responseText);
		
			this.controller.showAlertDialog({
				title: $L("Unable to login!"),
				message: "<div align='justify'>" + $L("Login to Google Docs failed, please check your username and password.") + "</div>",
				choices:[{label:$L("OK"), value:"ok", type:'default'}],
				preventCancel: true,
				allowHTMLMessage: true}); 

			this.modelExportGDButton.disabled = false;
	
			this.controller.modelChanged(this.modelExportGDButton, this);
		}.bind(this)
	});  
}

//

GdmAssistant.prototype.initializeGoogleMaps = function() {
	if(this.data) {
		var latlng = new google.maps.LatLng(this.data.lat, this.data.lng);
		var zoom = 12;
	}
	else {
		var latlng = new google.maps.LatLng(64.000, 26.000);
		var zoom = 5;
	}

	var mapOptions = {
		'zoom': zoom,
		'center': latlng,
		'mapTypeId': google.maps.MapTypeId.ROADMAP,
		'draggable': true,
		'mapTypeControl': false,
		'scaleControl': false,
		'navigationControl': false };

	this.map = new google.maps.Map(this.controller.get("MapViewCanvas"), mapOptions);

	this.marker = new google.maps.Marker({
		'position': latlng, 
		'map': this.map, 
		'title': "Location" });
  
	var rad = 200;
	
	if((this.data) && (this.filter))
		rad = parseInt(this.filter);
  
	var circle = new google.maps.Circle({
		map: this.map,
		radius: rad
	});
  
	circle.bindTo('center', this.marker, 'position');
  
	google.maps.event.addListener(this.map, 'click', function(event) {
		this.marker.setPosition(event.latLng);
	}.bind(this));
	
	this.geocoder = new google.maps.Geocoder();
}

GdmAssistant.prototype.updateMapLocation = function(event) {
	this.geocoder.geocode({'address': this.modelMapViewAddress.value}, function(results, status) {
		if(status == google.maps.GeocoderStatus.OK) {
			if(results.length > 0) {
				this.map.setCenter(results[0].geometry.location);
				this.map.setZoom(12);
				this.marker.setPosition(results[0].geometry.location);
			}
		}
	}.bind(this));
}

//

GdmAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.back) {
		event.stop();

		if(this.viewLevel > 0) {
			this.viewLevel--;
	
			this.controller.listen(this.controller.get("ImportGDList"), Mojo.Event.listTap, 
				this.handlerImportModeData);

			this.controller.get('import-list').hide();
			this.controller.get('import').show();
		}
		else
			this.controller.stageController.popScene();			
	}
	else if(event.command == "zoom_out") {
		var zoom = this.map.getZoom();
		if(zoom > 0)
			zoom--;
			
		this.map.setZoom(zoom);
	}
	else if(event.command == "zoom_in") {
		var zoom = this.map.getZoom();
		if(zoom < 20)
			zoom++;
			
		this.map.setZoom(zoom);
	}
	else if(event.command == "done") {
		if(this.callback) {
			var latlng = this.marker.getPosition();

			this.callback(latlng.lat(), latlng.lng(), true);
			
			this.controller.stageController.popScene();			
		}
	}
	else if(event.command == "help") {
		this.controller.stageController.pushScene("support", this.customModes);
	}
}

//

GdmAssistant.prototype.cleanup = function() {
}

GdmAssistant.prototype.activate = function() {
}

GdmAssistant.prototype.deactivate = function() {
}

