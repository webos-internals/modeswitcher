/*
 *    MainAssistant - Mode Launcher's Default Configuration Scene
 */

function MainAssistant(params) {
	/* This is the creator function for your scene assistant object. It will be passed all the 
	 * additional parameters (after the scene name) that were passed to pushScene. The reference
	 * to the scene controller (this.controller) has not be established yet, so any initialization
	 * that needs the scene controller should be done in the setup function below. 
	 */

	this.appControl = Mojo.Controller.getAppController();
	this.appAssistant = this.appControl.assistant;

	this.params = params;

	this.extensions = {appsrvs: [], settings: [], triggers: []};

	this.preferences = {appsrvs: [], settings: [], triggers: []};

	this.activeModes = [];
	this.customModes = [];
	
	this.modeLocked = false;
	
	this.toggling = false;
}    

MainAssistant.prototype.setup = function() {
	/* This function is for setup tasks that have to happen when the scene is first created
	 * Use Mojo.View.render to render view templates and add them to the scene, if needed.
    * Setup widgets and add event handlers to listen to events from widgets here. 
    */

	if(this.appAssistant.isNewOrFirstStart)
		this.controller.get("subTitle").innerHTML = "Have you already <a href=\"https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=7A4RPR9ZX3TYS&lc=FI&item_name=Mode%20Switcher%20Application&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted\">donated</a>?";

	this.controller.get("version").innerHTML = "v" + Mojo.Controller.appInfo.version;

	// Application menu
	
	this.modelAppMenu = {visible: true, items: [ 
		{label: $L("Export Modes"), command: 'export'},
		{label: $L("Import Modes"), command: 'import'},
		{label: $L("Extensions"), command: 'prefs'},
		{label: $L("Status"), command: 'status'},
		{label: $L("Help"), command: 'help'}]}
	
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true},
		this.modelAppMenu);
	
	// Activated toggle button

	this.modelActivatedButton = { value: false, disabled: true };

	this.controller.setupWidget('ActivatedButton', 
		{falseValue: false, falseLabel: $L("Off"), trueValue: true, trueLabel: $L("On")},
      this.modelActivatedButton);

	Mojo.Event.listen(this.controller.get('ActivatedButton'), 
		Mojo.Event.propertyChange, this.toggleModeSwitcher.bind(this));

	Mojo.Event.listen(this.controller.get('StatusText'), 
		Mojo.Event.tap, this.toggleModeSwitcher.bind(this));

	// Auto start & close timer selectors
	
	this.choicesStartSelector = [
		{label: "5 " + $L("Seconds"), value: 5},
		{label: "10 " + $L("Seconds"), value: 10},
		{label: "15 " + $L("Seconds"), value: 15},
		{label: "20 " + $L("Seconds"), value: 20},
		{label: "25 " + $L("Seconds"), value: 25},
		{label: "30 " + $L("Seconds"), value: 30}];

	this.modelStartSelector = {value: 10, disabled: true};
	   
	this.controller.setupWidget("StartSelector", {
		label: $L("Start Timer"),
		labelPlacement: "left", 							
		choices: this.choicesStartSelector},
		this.modelStartSelector);

	this.choicesCloseSelector = [
		{label: "5 " + $L("Seconds"), value: 5},
		{label: "10 " + $L("Seconds"), value: 10},
		{label: "15 " + $L("Seconds"), value: 15},
		{label: "20 " + $L("Seconds"), value: 20},
		{label: "25 " + $L("Seconds"), value: 25},
		{label: "30 " + $L("Seconds"), value: 30}];
		
	this.modelCloseSelector = {value: 10, disabled: true};
	   
	this.controller.setupWidget("CloseSelector", {
		label: $L("Close Timer"),
		labelPlacement: "left", 							
		choices: this.choicesCloseSelector},
		this.modelCloseSelector);
		
	Mojo.Event.listen(this.controller.get('StartSelector'), 
		Mojo.Event.propertyChange, this.setTimerPreferences.bind(this));

	Mojo.Event.listen(this.controller.get('CloseSelector'), 
		Mojo.Event.propertyChange, this.setTimerPreferences.bind(this));

	// Modes List
	
	this.modelModesList = {items: [], disabled: true};
	
	this.controller.setupWidget("ModesList", {
		itemTemplate: 'templates/modes-item',
		swipeToDelete: true,
		autoconfirmDelete: false,
		reorderable: true},
		this.modelModesList);
	
	this.handleModesListTap = this.handleModesListTap.bindAsEventListener(this);

	Mojo.Event.listen(this.controller.get('ModesList'), Mojo.Event.listTap, 
		this.handleModesListTap);
					
	Mojo.Event.listen(this.controller.get('ModesList'), Mojo.Event.listReorder, 
		this.handleModesListReorder.bind(this));

	Mojo.Event.listen(this.controller.get('ModesList'), Mojo.Event.listDelete, 
		this.handleRemoveModeFromList.bind(this));

	// Add custom mode button

	this.modelAddModeButton = {buttonClass: '', disabled: true};

	this.controller.setupWidget('AddModeButton', 
		{label: $L("Add Custom Mode")}, this.modelAddModeButton);
	
	Mojo.Event.listen(this.controller.get('AddModeButton'), Mojo.Event.tap, 
		this.handleAddModeButtonPress.bind(this));

	// Edit default mode button

	this.modelDefModeButton = {buttonClass: '', disabled: true};

	this.controller.setupWidget('DefModeButton', 
		{label: $L("Edit Default Mode")}, this.modelDefModeButton);
	
	Mojo.Event.listen(this.controller.get('DefModeButton'), Mojo.Event.tap, 
		this.handleDefModeButtonPress.bind(this));
}

//

MainAssistant.prototype.updatePreferences = function(response) {
	this.modeLocked = response.modeLocked;

	if(this.modeLocked)
		this.controller.get("StatusText").innerHTML = "Activated & Locked";

	this.modelActivatedButton.value = response.activated;

	this.controller.modelChanged(this.modelActivatedButton, this);

	this.activeModes = response.activeModes;
	this.customModes = response.customModes;
	
	this.modelModesList.items.clear();

	for(var i = 1; i < this.customModes.length; i++)
		this.modelModesList.items.push(this.customModes[i]);

	this.controller.modelChanged(this.modelModesList, this);	
		
	this.modelStartSelector.value = response.startTimer / 1000;
	this.modelCloseSelector.value = response.closeTimer / 1000;

	this.controller.modelChanged(this.modelStartSelector, this);
	this.controller.modelChanged(this.modelCloseSelector, this);

	this.extensions = response.extensions;
	this.preferences = response.preferences;

	// Check for need of initial default mode setup
	
	if((this.appAssistant.isNewOrFirstStart == 1) || (this.customModes.length == 0)) {
		this.extensions = {
			appssrvs: ["browser", "default", "govnah", "modesw", "phone", "systools"],
			settings: ["airplane", "calendar", "connection", "contacts", "email", "messaging", 
				"network", "phone", "ringer", "screen", "security", "sound"],
			triggers: ["application", "battery", "bluetooth", "calevent", "charger", 
				"display", "headset", "location", "modechange", "silentsw", "timeofday", "wireless"] };

		this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
			method: 'prefs', parameters: {extensions: this.extensions},
			onComplete: function() {

				this.controller.showAlertDialog({
					title: $L("Enable Advanced Features?"),
					message: "<div align='justify'>" + 
						$L("You need to have <b>Advanced System Prefs</b> patches installed before enabling advanced features! " +
						"You can change this setting later by selecting <b>Extensions</b> from the app menu. " +
						"Advanced features enables calendar / messaging / email settings and charger / battery triggers.") + "</div>",
					choices:[{label:$L("Yes"), value:true, type:'affirmative'},{label:$L("No"), value:false, type:'negative'}],
					preventCancel: true,
					allowHTMLMessage: true,
					onChoose: function(value) {
						var cookie = new Mojo.Model.Cookie('preferences');

						cookie.put({ 'advancedPrefs': value });
						
						this.controller.showAlertDialog({
							title: $L("Initial setup of Mode Switcher!"),
							message: "<div align='justify'>" + 
								$L("<i>Mode Switcher</i> needs to retrieve your current system settings for <i>Default Mode</i>. " +
								"This operation should only take few seconds to finish. You can modify the <i>Default Mode</i> " +
								"afterwards by clicking the <i>Edit Default Mode</i> button.") + "</div>",
							choices:[{label:$L("Continue"), value:"ok", type:'default'}],
							preventCancel: true,
							allowHTMLMessage: true,
							onChoose: function(value) {
								this.controller.stageController.pushScene("mode", this.extensions, this.customModes, 0);
							}.bind(this)}); 
					}.bind(this)}); 
			}.bind(this)});					
	}
	else {
		this.appAssistant.isNewOrFirstStart = 0;	
		
		this.modelActivatedButton.disabled = false;
		this.controller.modelChanged(this.modelActivatedButton, this);
		
		this.modelStartSelector.disabled = false;
		this.controller.modelChanged(this.modelStartSelector, this);

		this.modelCloseSelector.disabled = false;
		this.controller.modelChanged(this.modelCloseSelector, this);
		
		this.modelModesList.disabled = false;
		this.controller.modelChanged(this.modelModesList, this);
		
		this.modelAddModeButton.disabled = false;
		this.controller.modelChanged(this.modelAddModeButton, this);
		
		this.modelDefModeButton.disabled = false;
		this.controller.modelChanged(this.modelDefModeButton, this);
		
		if((this.params) && (this.params.name != undefined)) {
			for(var i = 0; i < this.customModes.length; i++) {
				if(this.customModes[i].name == this.params.name) {
					this.controller.stageController.pushScene("mode", this.extensions, this.customModes, i);

					this.params = null;
					
					break;
				}
			}
		}
	}
}

//

MainAssistant.prototype.toggleModeSwitcher = function(event) {
	if((event.up) && (event.up.altKey)) {
		if((this.toggling) || (!this.modelActivatedButton.value))
			return;

		this.toggling = true;

		if(this.modeLocked) {
			this.modeLocked = false;
		
			this.controller.get("StatusText").innerHTML = "Activated";
		
		 	this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
				method: 'control', parameters: {action: "unlock"},
				onComplete: function() { this.toggling = false; }.bind(this)});
		}
		else {
			this.modeLocked = true;

			this.controller.get("StatusText").innerHTML = "Activated & Locked";

		 	this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
				method: 'control', parameters: {action: "lock"},
				onComplete: function() { this.toggling = false; }.bind(this)});
		}
	}
	else {
		if(this.toggling) {
			if(this.modelActivatedButton.value)
				this.modelActivatedButton.value = false;
			else
				this.modelActivatedButton.value = true;
	
			this.controller.modelChanged(this.modelActivatedButton, this);
	
			return;
		}

		this.toggling = true;

		this.controller.get("StatusText").innerHTML = "Activated";

		if(this.modelActivatedButton.value) {
			this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
				method: 'control', parameters: {action: "enable"},
				onComplete: function() {
					this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
						method: 'execute', parameters: {action: "start", name: "Default Mode"},
						onComplete: function() {
							this.toggling = false;
						}.bind(this)});
				}.bind(this)});
		}
		else {
			this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
				method: 'control', parameters: {action: "disable"},
				onComplete: function() {
					this.toggling = false;
				}.bind(this)});					
		}		
	}
}

//

MainAssistant.prototype.setTimerPreferences = function(event) {
	this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
			method: 'prefs', parameters: {
				startTimer: this.modelStartSelector.value * 1000,
				closeTimer: this.modelCloseSelector.value * 1000}});
}

//

MainAssistant.prototype.handleModesListTap = function(event) {
	var index = event.model.items.indexOf(event.item);
	
	if((event.originalEvent.up) && (event.originalEvent.up.altKey)) {
		this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", { 
			'method': "execute", 'parameters': {'action': "toggle", 'name': this.customModes[index + 1].name}});
	}
	else if (index >= 0)
		this.controller.stageController.pushScene("mode", this.extensions, this.customModes, index + 1);
}

MainAssistant.prototype.handleModesListReorder = function(event) {
	var tempMode = this.customModes[event.fromIndex + 1];
	
	this.customModes.splice(event.fromIndex + 1, 1);
	this.customModes.splice(event.toIndex + 1, 0, tempMode);

	tempMode = this.modelModesList.items[event.fromIndex];

	this.modelModesList.items.splice(event.fromIndex, 1);
	this.modelModesList.items.splice(event.toIndex, 0, tempMode);
	
	this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
		method: 'prefs', parameters: {customModes: this.customModes}});
}

MainAssistant.prototype.handleRemoveModeFromList = function(event) {
	this.customModes.splice(event.index + 1, 1);

	this.modelModesList.items.splice(event.index, 1);

	this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
		method: 'prefs', parameters: {customModes: this.customModes}});
}

MainAssistant.prototype.handleAddModeButtonPress = function() {
	if((event.up) && (event.up.altKey)) {
		if(this.customModes.length > 1)
			this.customModes.splice(1, this.customModes.length - 1);		
			
		this.modelModesList.items.clear();

		this.controller.modelChanged(this.modelModesList, this);

		this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
			method: 'prefs', parameters: {customModes: this.customModes}});
	}
	else
		this.controller.stageController.pushScene("mode", this.extensions, this.customModes);
}

MainAssistant.prototype.handleDefModeButtonPress = function() {
	if((event.up) && (event.up.altKey)) {
		var id = this.customModes[0]._id;
	
		this.customModes[0] = {'_id': id, 
			'name': "Default Mode", 'type': "default", 'startup': 0, 'start': 1,
			'appssrvs': {'start': 0, 'close': 0, 'list': []},
			'settings': {'notify': 2, 'list': []},
			'triggers': {'require': 0, 'list': []}
		};
			
		this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
			method: 'prefs', parameters: {customModes: this.customModes}});
	}
	else
		this.controller.stageController.pushScene("mode", this.extensions, this.customModes, 0);
}

MainAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.back) {
		this.controller.stageController.deactivate();		
	}
	else if(event.type == Mojo.Event.command) {
		if(event.command == "prefs") {
			this.controller.stageController.pushScene("prefs", this.extensions, this.preferences);
		}
		else if(event.command == "export") {
			this.controller.stageController.pushScene("gdm", "exportGDoc", "Modes", "[MSALL]", this.customModes, null);
		}
		else if(event.command == "import") {
			this.controller.stageController.pushScene("gdm", "importGDoc", "Modes", "[MSALL]", null, this.importAllModes.bind(this));
		}
		else if(event.command == "status") {
			this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
				method: 'status', parameters: {},
				onComplete: function(response) {
					if((response) && (response.activeModes)) {
						var text = "";
			
						if(response.activeModes.length == 0)
							text += "Mode Switcher is not activated.";
						else {
							text += "<div style='float:left;'><b>Current Mode:</b></div><div style='float:right;'>" + response.activeModes[0].name + "</div><br><br>";

							text += "<div style='float:left;'><b>Modifier Modes:</b></div><div style='float:right;'>" + (response.activeModes.length - 1) + " Active</div><br>";
				
							if(response.activeModes.length > 0) {
								text += "<br>";
					
								for(var i = 1; i < response.activeModes.length; i++) {
									text += response.activeModes[i].name;
						
									if(i < (response.activeModes.length - 1))
										text += ", ";
								}
							}
						}

						this.controller.showAlertDialog({
							title: $L("Mode Switcher Status"),
							message: text,
							choices:[
								{label:$L("Close"), value:"close", type:'default'}],
							preventCancel: true,
							allowHTMLMessage: true,
							onChoose: function(appControl, value) {
							}.bind(this, this.appControl)}); 

					}
				}.bind(this)});
		}		
		else if(event.command == "help") {
			this.controller.stageController.pushScene("support", this.customModes);
		}
	}
}

MainAssistant.prototype.importAllModes = function(modes) {
	this.controller.showAlertDialog({
		title: $L("Select Modes for Importing"),
	/*	message: "<div align='justify'>" + $L("What modes should be imported?") + "</div>",*/
		choices:[
			{label:$L("Import All Modes"), value:"all", type:'default'},
			{label:$L("Only Import Default Mode"), value:"default", type:'default'},
			{label:$L("Only Import Custom Modes"), value:"custom", type:'default'}],
		preventCancel: true,
		allowHTMLMessage: true,
		onChoose: function(modes, value) {
			for(var i = 0; i < modes.length; i++) {
				var mode = modes[i];

				if((mode.appssrvs != undefined) && (mode.appssrvs.start != undefined) && 
					(mode.appssrvs.close != undefined) && (mode.appssrvs.list != undefined) &&
					(mode.settings != undefined) && (mode.settings.notify != undefined) && 
					(mode.triggers != undefined) && (mode.triggers.require != undefined) &&
					(mode.settings.list != undefined) && (mode.triggers.list != undefined))
				{
					if((mode.name == undefined) || (mode.name.length == 0) || 
						(mode.name == "Current Mode") || (mode.name == "Previous Mode") ||
						(mode.name == "All Modes") || (mode.name == "All Normal Modes") ||
						(mode.name == "All Modifier Modes"))
					{
						Mojo.Log.error("Invalid mode name in import");
					}
					else if((mode.name == "Default Mode") && (mode.type == "default") &&
						(mode.startup != undefined) && (mode.start != undefined))
					{
						if((value == "all") || (value == "default")) {
							if(this.customModes[0]._id != undefined)
								var id = this.customModes[0]._id;
						
							this.customModes.splice(0, 1, mode);
							
							if(id != undefined)
								this.customModes[0]._id = id;
						}
					}
					else if(((mode.type == "normal") || (mode.type == "modifier")) &&
						(mode.start != undefined) && (mode.close != undefined))
					{
						if((value == "all") || (value == "custom")) {
							var index = this.customModes.search("name", mode.name);
				
							if(index != -1) {
								mode.name = mode.name + " (I)";

								var index = this.customModes.search("name", mode.name);
								
								if(index != -1) {
									if(this.customModes[index]._id != undefined)
										var id = this.customModes[index]._id;
						
									this.customModes.splice(index, 1, mode);
							
									if(id != undefined)
										this.customModes[index]._id = id;
								}
								else
									this.customModes.push(mode);								
							}
							else
								this.customModes.push(mode);
						}
					}
					else
						Mojo.Log.error("Malformed mode data in import");
				}
				else
					Mojo.Log.error("Malformed mode data in import");
			}

			this.modelModesList.items.clear();

			for(var i = 1; i < this.customModes.length; i++)
				this.modelModesList.items.push(this.customModes[i]);

			this.controller.modelChanged(this.modelModesList, this);
		
			this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
				method: 'prefs', parameters: {customModes: this.customModes}});
		}.bind(this, modes)});
}

//

MainAssistant.prototype.activate = function(event) {
	/* Put in event handlers here that should only be in effect when this scene is active. 
	 *	For  example, key handlers that are observing the document. 
	 */

	if((event != undefined) && (event.customModes != undefined) && (event.modeIndex != undefined)) {
		this.controller.stageController.pushScene("mode", this.extensions, event.customModes, event.modeIndex);
	}
	else {
		// Check status and setup preference subscriptions for Mode Switcher service.
	
		this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
			method: 'prefs', parameters: {keys: ["activated", "modeLocked", "startTimer", 
				"closeTimer", "activeModes", "customModes", "extensions", "preferences"]}, 
			onSuccess: this.updatePreferences.bind(this),
			onFailure: function(response) {
				this.controller.showAlertDialog({
					title: $L("Unknown Service Error!"),
					message: "<div align='justify'>" + $L("<i>Mode Switcher</i> service not responding.") + "</div>",
					choices:[{label:$L("Continue"), value:"ok", type:'default'}],
					preventCancel: true,
					allowHTMLMessage: true}); 
			}.bind(this)});
	}
}
	
MainAssistant.prototype.deactivate = function(event) {
	/* Remove any event handlers you added in activate and do any other cleanup that should 
	 * happen before this scene is popped or another scene is pushed on top. 
	 */
}

MainAssistant.prototype.cleanup = function(event) {
	/* This function should do any cleanup needed before the scene is destroyed as a result
	 * of being popped off the scene stack.
	 */ 

 	this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
		method: 'control', parameters: {action: "reload", name: "Current Mode"}});
}

