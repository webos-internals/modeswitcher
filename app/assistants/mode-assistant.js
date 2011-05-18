/*
 *    ModeAssistant - Mode Launcher's Mode Edition Scene
*/

function ModeAssistant(apiVersion, cfgVersion, extensions, customModes, modeIndex) {
	/* This is the creator function for your scene assistant object. It will be passed all the 
	 * additional parameters (after the scene name) that were passed to pushScene. The reference
	 * to the scene controller (this.controller) has not be established yet, so any initialization
	 * that needs the scene controller should be done in the setup function below. 
	 */

	this.appControl = Mojo.Controller.getAppController();
	this.appAssistant = this.appControl.assistant;
	
	this.apiVersion = apiVersion;
	this.cfgVersion = cfgVersion;
	
	this.extensions = extensions;
	
	this.customModes = customModes;
	
	this.modeIndex = modeIndex;

	this.actionsConfig = {};
	this.settingsConfig = {};
	this.triggersConfig = {};
	
	this.loaded = {'actions': [], 'settings': [], 'triggers': []};

	this.retrieving = false;

	this.groupidx = 0;
}    

ModeAssistant.prototype.setup = function() {
	/* This function is for setup tasks that have to happen when the scene is first created
	 * Use Mojo.View.render to render view templates and add them to the scene, if needed.
    * Setup widgets and add event handlers to listen to events from widgets here. 
    */

	this.cookie = new Mojo.Model.Cookie('preferences');

	var prefs = this.cookie.get();
	
	if(!prefs)
		prefs = {'advancedPrefs': false};
		
	//	

	for(var i = 0; i < this.extensions.actions.length; i++) {
		var className = this.extensions.actions[i].charAt(0).toUpperCase() + this.extensions.actions[i].slice(1);

		this.actionsConfig[this.extensions.actions[i]] = eval("new " + className + "Actions(this.controller, prefs);");
	}

	for(var i = 0; i < this.extensions.settings.length; i++) {
		var className = this.extensions.settings[i].charAt(0).toUpperCase() + this.extensions.settings[i].slice(1);

		this.settingsConfig[this.extensions.settings[i]] = eval("new " + className + "Settings(this.controller, prefs);");
	}
 
	for(var i = 0; i < this.extensions.triggers.length; i++) {
		var className = this.extensions.triggers[i].charAt(0).toUpperCase() + this.extensions.triggers[i].slice(1);

		this.triggersConfig[this.extensions.triggers[i]] = eval("new " + className + "Triggers(this.controller, prefs);");
	}

//

	this.mode = this.getModeData();

	this.modelWaitSpinner = { spinning: false };

	this.controller.setupWidget('waitSpinner', {spinnerSize: Mojo.Widget.spinnerLarge}, this.modelWaitSpinner);

//
// Application menu
//
	
	if(this.modeIndex == 0) {
		this.controller.setupWidget(Mojo.Menu.appMenu, 
			{'omitDefaultItems': true}, {'visible': true, 'items': [ 
			{'label': $L("Export Config"), 'command': "export"},
			{'label': $L("Import Config"), 'command': "import"},
			{'label': $L("Help"), 'command': "help"}]});
	} 
	else {
		this.controller.setupWidget(Mojo.Menu.appMenu, 
			{'omitDefaultItems': true}, {'visible': true, 'items': [ 
			{'label': $L("Add to Launcher"), 'command': "launchpoint"},
			{'label': $L("Export Config"), 'command': "export"},
			{'label': $L("Import Config"), 'command': "import"},
			{'label': $L("Status"), command: "status"},
			{'label': $L("Help"), command: "help"}]});
	}
	
//
// View Menu
//

	this.currentView = "Configuration";

	this.configurationView = this.controller.get("ConfigurationView");
	
	this.configurationView.style.display = 'block';
		
//
// Command menu
//

	this.settingsView = this.controller.get("ModeSettingsView");
	this.appsView = this.controller.get("ModeAppsView");
	this.triggersView = this.controller.get("ModeTriggersView");

	this.customCfg = this.controller.get("ConfigurationCustom");
	this.defaultCfg = this.controller.get("ConfigurationDefault");

	if(this.modeIndex == 0) {
		this.defaultCfg.style.display = 'block';

		this.itemsCommandMenu = [
			{'width': 35},
			{'label': $L("Settings"), 'command': "settings", 'width': 110},
			{'width': 30},
			{'label': $L("Actions"), 'command': "applications", 'width': 110},
			{'width': 35} ];
	}
	else {
		this.customCfg.style.display = 'block';
	
		this.itemsCommandMenu = [
			{'width': 5},
			{'label': $L("Settings"), 'command': "settings", 'width': 100},
			{'label': $L("Actions"), 'command': "applications", 'width': 90},
			{'label': $L("Triggers"), 'command': "triggers", 'width': 100},
			{'width': 5} ];
	}

	this.modelCommandMenu = {'visible': true, 'items': this.itemsCommandMenu};
		
	this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.modelCommandMenu);
	
//
// MODE CONFIGURATION
//

	// Mode name text field
	
	if(this.modeIndex == 0)
		this.modelNameText = {'value': $L(this.mode.name), 'disabled': true};
	else
		this.modelNameText = {'value': this.mode.name, 'disabled': false};
		   
	this.controller.setupWidget("NameText", { 'hintText': $L("Unique Mode Name"), 
		'multiline': false, 'enterSubmits': false, 'focus': true},
		this.modelNameText);

	Mojo.Event.listen(this.controller.get("NameText"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	Mojo.Event.listen(this.controller.get("NameTextHelp"), Mojo.Event.tap, 
		this.helpItemTapped.bind(this, "NameTextHelp"));

	// Mode type selector

	if(this.modeIndex == 0)
		this.modelTypeSelector = {'value': "default", 'disabled': true};
	else
		this.modelTypeSelector = {'value': this.mode.type, 'disabled': false};
		
	if(this.modeIndex == 0) {
		this.choicesTypeSelector = [
			{'label': $L("Default"), 'value': "default"}];  
	}
	else {
		this.choicesTypeSelector = [
			{'label': $L("Normal"), 'value': "normal"},
			{'label': $L("Modifier"), 'value': "modifier"}];  
	}

	this.controller.setupWidget("ModeTypeSelector", {'label': $L("Mode Type"), 
		'labelPlacement': "left", 'choices': this.choicesTypeSelector}, 
		this.modelTypeSelector);

	Mojo.Event.listen(this.controller.get("ModeTypeSelector"), Mojo.Event.propertyChange, 
		this.setModeType.bind(this));

	Mojo.Event.listen(this.controller.get("ModeTypeHelp"), Mojo.Event.tap, 
		this.helpItemTapped.bind(this, "ModeTypeHelp"));

	// Auto start and close selectors

	this.modelStartSelector = {'value': this.mode.start, 'disabled': false};

	this.choicesStartSelector = [
		{'label': $L("Only Manually"), 'value': 0},
		{'label': $L("By Selection"), 'value': 1},
		{'label': $L("After Timer"), 'value': 2},
		{'label': $L("Immediate"), 'value': 3}];  
				
	this.controller.setupWidget("StartSelector",	{'label': $L("Auto Start"),
		'labelPlacement': "left", 'choices': this.choicesStartSelector},
		this.modelStartSelector);
	
	Mojo.Event.listen(this.controller.get("StartSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	Mojo.Event.listen(this.controller.get("ModeStartHelp"), Mojo.Event.tap, 
		this.helpItemTapped.bind(this, "ModeStartHelp"));
		
	this.modelCloseSelector = {'value': this.mode.close, 'disabled': false};

	this.choicesCloseSelector = [
		{'label': $L("Only Manually"), 'value': 0},
		{'label': $L("By Selection"), 'value': 1},
		{'label': $L("After Timer"), 'value': 2},
		{'label': $L("Immediate"), 'value': 3}];  

	this.controller.setupWidget("CloseSelector",	{'label': $L("Auto Close"), 
		'labelPlacement': "left", 'choices': this.choicesCloseSelector},
		this.modelCloseSelector);
	
	Mojo.Event.listen(this.controller.get("CloseSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	Mojo.Event.listen(this.controller.get("ModeCloseHelp"), Mojo.Event.tap, 
		this.helpItemTapped.bind(this, "ModeCloseHelp"));

	// Mode startup selector

	this.modelStartupSelector = {'value': this.mode.startup, 'disabled': false};

	this.choicesStartupSelector = [
		{'label': $L("Active Mode"), 'value': 0},
		{'label': $L("Default Mode"), 'value': 1}];  
	
	this.controller.setupWidget("StartupSelector", {'label': $L("On Startup"), 
		'labelPlacement': "left", 'choices': this.choicesStartupSelector}, 
		this.modelStartupSelector);

	Mojo.Event.listen(this.controller.get("StartupSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	Mojo.Event.listen(this.controller.get("ModeStartupHelp"), Mojo.Event.tap, 
		this.helpItemTapped.bind(this, "ModeStartupHelp"));
	
	// Apps startup selector
	
	this.modelAppsSelector = {'value': this.mode.start, 'disabled': false};

	this.choicesAppsSelector = [
		{'label': $L("Everytime"), 'value': 0},
		{'label': $L("On Startup"), 'value': 1} ];  

	this.controller.setupWidget("AppsSelector", {'label': $L("Applications"), 
		'labelPlacement': "left", 'choices': this.choicesAppsSelector},
		this.modelAppsSelector);	

	Mojo.Event.listen(this.controller.get("AppsSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	Mojo.Event.listen(this.controller.get("ModeAppsHelp"), Mojo.Event.tap, 
		this.helpItemTapped.bind(this, "ModeAppsHelp"));
			
//
// APPLICATIONS
//

	// Application start selector
	
	this.choicesAppsStartSelector = [
		{'label': $L("Do Nothing"), 'value': 0},
		{'label': $L("Close All Apps"), 'value': 2}];  
		
	this.modelAppsStartSelector = {'value': this.mode.actions.start, 'disabled': false};
		
	this.controller.setupWidget("AppsStartSelector", {'label': $L("On Start"), 
		'labelPlacement': "left", 'choices': this.choicesAppsStartSelector},
		this.modelAppsStartSelector);

	Mojo.Event.listen(this.controller.get("AppsStartSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	Mojo.Event.listen(this.controller.get("AppsStartHelp"), Mojo.Event.tap, 
		this.helpItemTapped.bind(this, "AppsStartHelp"));

	// Application close selector

	this.choicesAppsCloseSelector = [
		{'label': $L("Do Nothing"), 'value': 0},
		{'label': $L("Close Started"), 'value': 1},
		{'label': $L("Close All Apps"), 'value': 2}];  
		
	this.modelAppsCloseSelector = {'value': this.mode.actions.close, 'disabled': false};
		
	this.controller.setupWidget("AppsCloseSelector", {'label': $L("On Close"), 
		'labelPlacement': "left", 'choices': this.choicesAppsCloseSelector},
		this.modelAppsCloseSelector);

	Mojo.Event.listen(this.controller.get("AppsCloseSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	Mojo.Event.listen(this.controller.get("AppsCloseHelp"), Mojo.Event.tap, 
		this.helpItemTapped.bind(this, "AppsCloseHelp"));

	// Applications list

	this.modelAppsList = {'items': this.mode.actions.list};
	
	this.controller.setupWidget("AppsList", {
		'itemTemplate': 'templates/lists-item',
		'swipeToDelete': true, 'reorderable': true,
		'autoconfirmDelete': true},
		this.modelAppsList);

	// Applications extensions lists

	for(var id in this.actionsConfig) {
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";
		
		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/actions/' + id + '-listitem',
			'swipeToDelete': false, 'reorderable': false, 'itemsProperty': id});
	}

	for(var i = 0; i < this.loaded.actions.length; i++) {
		var id = this.loaded.actions[i].extension;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";
		
		var appsrv = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};
		
		appsrv[id] = [this.loaded.actions[i]]; 

		this.mode.actions.list.push(appsrv);
	}

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "apps"));

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.listReorder, 
		this.handleListReorder.bind(this, "apps"));

	Mojo.Event.listen(this.controller.get("AppsList"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, true));

//
// APPS LIST ITEM
//

	for(var id in this.actionsConfig)
		this.actionsConfig[id].setup();

//
// SETTINGS
//

	// Mode notify selector

	this.modelNotifySelector = {'value': this.mode.notify, 'disabled': false};

	if(this.mode.type == "default") {
		this.choicesNotifySelector = [
			{'label': $L("Disabled"), 'value': 1},
			{'label': $L("Only Banner"), 'value': 2},
			{'label': $L("Only Sound"), 'value': 3},
			{'label': $L("Only Vibrate"), 'value': 4},
			{'label': $L("Banner + Sound"), 'value': 5},
			{'label': $L("Banner + Vibrate"), 'value': 6}];  
	}
	else {
		this.choicesNotifySelector = [
			{'label': $L("Default"), 'value': 0},
			{'label': $L("Disabled"), 'value': 1},
			{'label': $L("Only Banner"), 'value': 2},
			{'label': $L("Only Sound"), 'value': 3},
			{'label': $L("Only Vibrate"), 'value': 4},
			{'label': $L("Banner + Sound"), 'value': 5},
			{'label': $L("Banner + Vibrate"), 'value': 6}];  
	}
		
	this.controller.setupWidget("NotifySelector", {'label': $L("Notify"), 
		'labelPlacement': "left", 'choices': this.choicesNotifySelector}, 
		this.modelNotifySelector);

	Mojo.Event.listen(this.controller.get("NotifySelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	Mojo.Event.listen(this.controller.get("SettingsNotifyHelp"), Mojo.Event.tap, 
		this.helpItemTapped.bind(this, "SettingsNotifyHelp"));
		
	// Settings list

	this.modelSettingsList = {'items': this.mode.settings};
	
	this.controller.setupWidget("SettingsList", {
		'itemTemplate': 'templates/lists-item',
		'swipeToDelete': true, 'reorderable': false,
		'autoconfirmDelete': true},
		this.modelSettingsList);

	// Settings extensions lists

	for(var id in this.settingsConfig) {
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/settings/' + id + '-listitem',
			'swipeToDelete': false, 'reorderable': false, 'itemsProperty': id});
	}

	for(var i = 0; i < this.loaded.settings.length; i++) {
		var id = this.loaded.settings[i].extension;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		var setting = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};
		
		setting[id] = [this.loaded.settings[i]];

		setting['extension'] = this.loaded.settings[i].extension;

		this.mode.settings.push(setting);
	}

	Mojo.Event.listen(this.controller.get("SettingsList"), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "settings"));

	Mojo.Event.listen(this.controller.get("SettingsList"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, true));

//
// SETTINGS LIST ITEMS
//

	for(var id in this.settingsConfig) {
		if(this.mode.type == "normal")
			this.settingsConfig[id].setup($L("Default"));
		else
			this.settingsConfig[id].setup($L("Do Not Set"));
	}

//
// TRIGGERS
//

	this.modelRequiredSelector = {'value': this.mode.require, 'disabled': false};

	this.choicesTriggerSelector = [
		{'label': $L("All Unique"), 'value': 0},
		{'label': $L("Any Trigger"), 'value': 1},
		{'label': $L("All Triggers"), 'value': 2} ];  

	this.controller.setupWidget("RequiredSelector",	{'label': $L("Required"), 
		'labelPlacement': "left", 'choices': this.choicesTriggerSelector},
		this.modelRequiredSelector);	

	Mojo.Event.listen(this.controller.get("RequiredSelector"), Mojo.Event.propertyChange, 
		this.setModeData.bind(this, false));

	Mojo.Event.listen(this.controller.get("TriggersRequiredHelp"), Mojo.Event.tap, 
		this.helpItemTapped.bind(this, "TriggersRequiredHelp"));

	// Triggers list

	this.modelTriggersList = {'items': this.mode.triggers};

	this.controller.setupWidget("TriggersList", {
		'itemTemplate': "templates/lists-item",
		'swipeToDelete': true, 'reorderable': false,
		'autoconfirmDelete': true},
		this.modelTriggersList);

	// Triggers extensions lists

	for(var id in this.triggersConfig) {
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		this.controller.setupWidget(element, {
			'itemTemplate': "../extensions/triggers/" + id + "-listitem",
			'swipeToDelete': false, 'reorderable': false, 'itemsProperty': id});
	}

	for(var i = 0; i < this.loaded.triggers[0].list.length; i++) {
		var id = this.loaded.triggers[0].list[i].extension;
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		var trigger = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};

		trigger[id] = [this.loaded.triggers[0].list[i]];

		trigger['extension'] = this.loaded.triggers[0].list[i].extension;

		this.mode.triggers.push(trigger);
	}

	Mojo.Event.listen(this.controller.get("TriggersList"), Mojo.Event.listDelete, 
		this.handleListDelete.bind(this, "triggers"));

	Mojo.Event.listen(this.controller.get("TriggersList"), Mojo.Event.propertyChange, 
		this.handleListChange.bind(this, "triggers"));

	//
	// TRIGGERS LIST ITEM
	//

	for(var id in this.triggersConfig)
		this.triggersConfig[id].setup();

	//
	// INITIALIZE DEFAULT MODE IF NEEDED
	//

	if((this.customModes.length == 0) || ((this.modeIndex == 0) &&
		(this.appAssistant.isNewOrFirstStart == 1)))
	{
		this.appAssistant.isNewOrFirstStart = 1;	
	
		this.mode.settings.clear();

		this.loaded.settings.clear();

		this.retrieveCurrentSettings(0, "everything");
	}

	this.controller.listen(this.controller.get('help-toggle'), Mojo.Event.tap, this.helpButtonTapped.bindAsEventListener(this));
}

//

ModeAssistant.prototype.getModeData = function(config) {
	if((this.modeIndex == 0) || (this.customModes.length == 0)) {
		var mode = {
			'name': "Default Mode", 'type': "default", 'startup': 0, 'start': 1, 'notify': 2, 
			'actions': {'start': 0, 'close': 0, 'list': []}, 'settings': [], 'triggers': []
		};
	}
	else {
		var mode = {
			'name': "", 'type': "normal", 'start': 1, 'close': 1, 'notify': 0, 
			'actions': {'start': 0, 'close': 1, 'list': []}, 'settings': [], 'triggers': []
		};		
	}
	
	if(!config) {
		if((this.modeIndex == undefined) || (this.customModes.length == 0)){
			mode.require = 0;
			this.loaded.triggers = [{require: 0, list: []}];
		
			return mode;
		}

		var config = this.customModes[this.modeIndex];
	}

	// Actual loading of the configuration.

	if(this.modeIndex != 0) {
		mode.name =  config.name;
		mode.type =  config.type;
	}
						
	if(this.modeIndex == 0) {
		mode.startup = config.startup;
		mode.start = config.start;
	}
	else {
		mode.start = config.start;
		mode.close = config.close;
	}
				
	mode.actions.start = config.actions.start;
	mode.actions.close = config.actions.close;

	for(var i = 0; i < config.actions.list.length; i++) {
		var ext = config.actions.list[i].extension;
			
		if(this.actionsConfig[ext] != undefined) {
			var data = this.actionsConfig[ext].load(config.actions.list[i]);
	
			data.extension = ext;

			this.loaded.actions.push(data);
		}
	}

	mode.notify = config.notify;

	for(var i = 0; i < config.settings.length; i++) {
		var ext = config.settings[i].extension;
			
		if(this.settingsConfig[ext] != undefined) {
			var data = this.settingsConfig[ext].load(config.settings[i]);
			
			data.extension = ext;
			
			this.loaded.settings.push(data);
		}
	}

	if(config.triggers.length == 0)
		mode.require = 0;
	else
		mode.require = config.triggers[0].require;

	for(var i = 0; i < config.triggers.length; i++) {
		var trigger = {require: config.triggers[i].require, list: []};
	
		for(var j = 0; j < config.triggers[i].list.length; j++) {
			var ext = config.triggers[i].list[j].extension;
			var cfg = config.triggers[i].list[j];
		
			if(this.triggersConfig[ext] != undefined) {
				var data = this.triggersConfig[ext].load(cfg);
	
				data.extension = ext;
				
				trigger.list.push(data);
			}
		}
		
		if(trigger.list.length > 0)
			this.loaded.triggers.push(trigger);
	}
	
	if(this.loaded.triggers.length == 0)
		this.loaded.triggers = [{require: 0, list: []}];	
	
	return mode;
}

ModeAssistant.prototype.setModeData = function(refresh) {
	if(refresh) {
		// FIXME: hack so that the list position is not resetted.

		var tmp = this.controller.sceneScroller.mojo.getState();

		if(this.currentView == "Settings")
			this.controller.modelChanged(this.modelSettingsList, this);
		else if(this.currentView == "Applications")
			this.controller.modelChanged(this.modelAppsList, this);
		else if(this.currentView == "Triggers")
			this.controller.modelChanged(this.modelTriggersList, this);

		this.controller.sceneScroller.mojo.setState(tmp);
	}

	if((this.modeIndex == 0) || (this.customModes.length == 0)) {
		var mode = {
			'name': "Default Mode", 'type': "default", 'startup': 0, 'start': 1, 'notify': 2, 
			'actions': {'start': 0, 'close': 0, 'list': []}, 'settings': [], 'triggers': []
		};
	}
	else {
		var mode = {
			'name': "", 'type': "normal", 'start': 1, 'close': 1, 'notify': 0, 
			'actions': {'start': 0, 'close': 1, 'list': []}, 'settings': [], 'triggers': []
		};
	}

	this.loaded.triggers[this.groupidx].require = this.modelRequiredSelector.value;

	if((this.customModes.length == 0) || (this.modeIndex == undefined)) {
		this.modeIndex = this.customModes.length;
		this.customModes.push(mode);
	}

	var config = this.customModes[this.modeIndex];

	if(this.modeIndex != 0) {
		this.checkModeName();

		mode.name = this.modelNameText.value;
		mode.type = this.modelTypeSelector.value;
	}

	if(this.modeIndex == 0) {
		mode.startup = this.modelStartupSelector.value;
		mode.start = this.modelAppsSelector.value;			
	}
	else {
		mode.start = this.modelStartSelector.value;
		mode.close = this.modelCloseSelector.value;
	}
	
	mode.actions.start = this.modelAppsStartSelector.value;
	mode.actions.close = this.modelAppsCloseSelector.value;								

	for(var i = 0; i < this.loaded.actions.length; i++) {
		var ext = this.loaded.actions[i].extension;
		
		if(this.actionsConfig[ext] != undefined) {
			var data = this.actionsConfig[ext].save(this.loaded.actions[i]);
	
			data.extension = this.loaded.actions[i].extension;

			mode.actions.list.push(data);
		}
	}

	mode.notify = 	this.modelNotifySelector.value;
		
	for(var i = 0; i < this.loaded.settings.length; i++) {
		var ext = this.loaded.settings[i].extension;
		
		if(this.settingsConfig[ext] != undefined) {
			var data = this.settingsConfig[ext].save(this.loaded.settings[i]);
			
			data.extension = this.loaded.settings[i].extension;
			
			mode.settings.push(data);
		}
	}

	for(var i = 0; i < this.loaded.triggers.length; i++) {
		var trigger = {require: this.loaded.triggers[i].require, list: []};

		for(var j = 0; j < this.loaded.triggers[i].list.length; j++) {
			var ext = this.loaded.triggers[i].list[j].extension;
			var cfg = this.loaded.triggers[i].list[j];
			
			if(this.triggersConfig[ext] != undefined) {
				var data = this.triggersConfig[ext].save(cfg);

				data.extension = ext;
		
				trigger.list.push(data);
			}
		}
		
		if(trigger.list.length > 0)
			mode.triggers.push(trigger);
	}

	this.customModes.splice(this.modeIndex, 1, mode);

	this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
		method: 'prefs', parameters: {customModes: this.customModes}});

	return mode;
}

//

ModeAssistant.prototype.setModeType = function(event) {
	if(event.value == "normal") {
		this.choicesNotifySelector[0].label = $L("Default");

		this.controller.defaultChoiseLabel = $L("Default");

		for(var id in this.settingsConfig)
			this.settingsConfig[id].setup($L("Default"));
	}
	else {
		this.choicesNotifySelector[0].label = $L("Do Not Set");

		this.controller.defaultChoiseLabel = $L("Do Not Set");

		for(var id in this.settingsConfig)
			this.settingsConfig[id].setup($L("Do Not Set"));
	}
	
	this.controller.modelChanged(this.modelNotifySelector, this);
	
	this.controller.modelChanged(this.modelSettingsList, this);
	
	this.setModeData(false);	
}

ModeAssistant.prototype.helpButtonTapped = function(event)
{
	if(this.controller.get('mode').hasClassName('help')) {
		this.controller.get('mode').removeClassName('help');
		event.target.removeClassName('selected');
	}
	else {
		this.controller.get('mode').addClassName('help');
		event.target.addClassName('selected');
	}
}

ModeAssistant.prototype.helpItemTapped = function(target) {
	if(target == "NameTextHelp") {
		var helpTitle = "Mode Name";

		var helpText = "Unique name for this mode.";
	}
	else if(target == "ModeTypeHelp") {
		var helpTitle = "Mode Type";

		var helpText = "Type of the mode (normal / modifier).<br><br><b>Normal Mode:</b> only one normal mode can be active at the time. Settings that are not set are taken from default mode.<br><b>Modifier Mode:</b> many modifier modes can be active at the same time and settings that are not set are left untouched.";
	}
	else if(target == "ModeStartHelp") {
		var helpTitle = "Auto Start";

		var helpText = "Determines how mode is started on trigger events.<br><br><b>Only Manually:</b> mode can't be started by triggers.<br><b>By Selection:</b> popup is shown with timer, when timer runs out mode is not changed.<br><b>After Timer:</b> popup is shown with timer, when timer runs out the mode is started.<br><b>Immeadiate:</b> mode is started immeadiately.";
	}
	else if(target == "ModeCloseHelp") {
		var helpTitle = "Auto Close";

		var helpText = "Determines how mode is closed on trigger events.<br><br><b>Only Manually:</b> mode can't be closed by triggers.<br><b>By Selection:</b> popup is shown with timer, when timer runs out mode is not changed.<br><b>After Timer:</b> popup is shown with timer, when timer runs out the mode is closed.<br><b>Immeadiate:</b> mode is closed immeadiately.";
	}
	else if(target == "ModeStartupHelp") {
		var helpTitle = "On Startup";

		var helpText = "Controls what mode should be started on phone startup.";
	}
	else if(target == "ModeAppsHelp") {
		var helpTitle = "Applications";

		var helpText = "Controls if default mode apps should be only started when mode is started on phone startup or every time.";
	}
	else if(target == "SettingsNotifyHelp") {
		var helpTitle = "Notify";

		var helpText = "Controls how the mode change should be notified.";
	}
	else if(target == "AppsStartHelp") {
		var helpTitle = "On Start";

		var helpText = "Determines what to do when mode is started.";
	}
	else if(target == "AppsCloseHelp") {
		var helpTitle = "On Close";

		var helpText = "Determines what to do when mode is closed.";
	}
	else if(target == "TriggersRequiredHelp") {
		var helpTitle = "Required";

		var helpText = "Controls what triggers needs to be valid for the mode to be active.<br><br><b>All Unique:</b> one of each type of triggers in the group needs to be valid.<br><b>Any Trigger:</b> only one trigger in the group needs to be valid.<br><b>All Triggers:</b> all triggers in the group needs to be valid.";
	}
	else
		return;
	
	this.controller.showAlertDialog({
		title: helpTitle,
		message: "<div style='text-align:justify;'>" + helpText + "</div>",
		choices:[{"label": "Close", "command": "close"}],
		preventCancel: false,
		allowHTMLMessage: true
	});
}

//

ModeAssistant.prototype.retrieveCurrentSettings = function(index, target) {
	if((index == 0) || (target == "single")) {
		Mojo.Log.info("Retrieving current system settings");

		this.controller.get("waitSpinner").show();

		this.modelWaitSpinner.spinning = true;
		
		this.controller.modelChanged(this.modelWaitSpinner, this);

		this.appControl.showBanner($L("Retrieving current system settings"), {});

		this.retrieving = true;
	}

	if(index < this.extensions.settings.length) {
		if(this.settingsConfig[this.extensions.settings[index]].label() == undefined)
			this.retrieveCurrentSettings(++index, target);
		else {
			Mojo.Log.info("Retrieving " + this.extensions.settings[index] + " settings");

			var callback = this.retrievedCurrentSettings.bind(this, index, target);

			this.settingsConfig[this.extensions.settings[index]].fetch(callback);
		}
	}
	else {
		Mojo.Log.info("Retrieving system settings finished");

		this.modelWaitSpinner.spinning = false;
		
		this.controller.modelChanged(this.modelWaitSpinner, this);

		this.controller.get("waitSpinner").hide();

		this.appControl.showBanner($L("Retrieving system settings finished"), {});

		this.retrieving = false;

		this.setModeData(true);
		
		if((this.modeIndex == 0) && (this.appAssistant.isNewOrFirstStart == 1)) {
			this.appAssistant.isNewOrFirstStart = 0;

			this.controller.stageController.popScene();
		}
	}
}

ModeAssistant.prototype.retrievedCurrentSettings = function(index, target, settings) {
	if(settings != undefined) {
		settings.extension = this.extensions.settings[index];

		this.loaded.settings.push(settings);

		this.loaded.settings.sort(this.sortAlphabeticallyFunction);

		var id = this.extensions.settings[index];
		
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		var setting = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};
		
		setting[id] = [settings]; 

		setting['extension'] = this.extensions.settings[index];

		this.mode.settings.push(setting);
		
		this.mode.settings.sort(this.sortAlphabeticallyFunction);
	}

	if(target == "everything")
		this.retrieveCurrentSettings(++index, target);
	else
		this.retrieveCurrentSettings(this.extensions.settings.length, target);
}

//

ModeAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.back) {
		event.stop();

		if(this.currentView == "Configuration") {
			this.setModeData(false);
		
			this.controller.stageController.popScene();
			return;
		}
	}
		
	if((event.type == Mojo.Event.command) || (event.type == Mojo.Event.back)) {
		if((event.command == "configuration") || (event.type == Mojo.Event.back)) {
			this.setModeData(true);

			this.currentView = "Configuration";

			this.modelCommandMenu.items.clear();

			if(this.modeIndex == 0) {			
				this.modelCommandMenu.items.push({'width': 35});
				this.modelCommandMenu.items.push({'label': $L("Settings"), 'command': "settings", 'width': 110});
				this.modelCommandMenu.items.push({'width': 30});
				this.modelCommandMenu.items.push({'label': $L("Actions"), 'command': "applications", 'width': 110});
				this.modelCommandMenu.items.push({'width': 35});
			}
			else {
				this.modelCommandMenu.items.push({'width': 5});
				this.modelCommandMenu.items.push({'label': $L("Settings"), 'command': "settings", 'width': 100});
				this.modelCommandMenu.items.push({'label': $L("Actions"), 'command': "applications", 'width': 90});
				this.modelCommandMenu.items.push({'label': $L("Triggers"), 'command': "triggers", 'width': 100});
				this.modelCommandMenu.items.push({'width': 5});				
			}

			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.appsView.style.display = "none";
			this.settingsView.style.display = "none";
			this.triggersView.style.display = "none";
			
			this.configurationView.style.display = "block";

			// FIXME: bug in Mojo if name field changed while hidden it is not shown properly.
			
			var name = this.modelNameText.value;
			this.modelNameText.value = "";
			this.controller.modelChanged(this.modelNameText, this);
			this.modelNameText.value = name;
			this.controller.modelChanged(this.modelNameText, this);
			
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == "settings") {
			this.setModeData(true);

			this.currentView = "Settings";
			
			this.modelCommandMenu.items.clear();

			var totalCount = 0;

			for(var i = 0; i < this.extensions.settings.length; i++) {
				if(this.settingsConfig[this.extensions.settings[i]].label() != undefined)
					totalCount++;
			}

			if(this.loaded.settings.length == totalCount)
				this.modelCommandMenu.items.push({'label': "+ " + $L("All"), 'command': "settings-all", 'disabled': true});
			else
				this.modelCommandMenu.items.push({'label': "+ " + $L("All"), 'command': "settings-all", 'disabled': false});
				
			this.modelCommandMenu.items.push({'label': $L("Add Setting"), 'command': "settings-add", 'disabled': false});

			if(this.loaded.settings.length == 0)
				this.modelCommandMenu.items.push({'label': $L("All") + " -", 'command': "settings-none", 'disabled': true});
			else
				this.modelCommandMenu.items.push({'label': $L("All") + " -", 'command': "settings-none", 'disabled': false});
			
			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.configurationView.style.display = "none";
			this.settingsView.style.display = "block";
			
			this.controller.sceneScroller.mojo.revealTop(0);

			// FIXME: Bug in slider widget, it has to be visible on setup or refreshed.

			this.controller.modelChanged(this.modelSettingsList, this);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);

			transition.run();
		}
		else if(event.command == "applications") {
			this.currentView = "Applications";
			
			this.modelCommandMenu.items.clear();
			this.modelCommandMenu.items.push({'label': $L("Add App"), 'command': "applications-app"});
			this.modelCommandMenu.items.push({'label': $L("Add MS"), 'command': "applications-ms"});
			this.modelCommandMenu.items.push({'label': $L("Add Srv"), 'command': "applications-srv"});

			this.controller.modelChanged(this.modelCommandMenu, this);
			
			this.configurationView.style.display = "none";
			this.appsView.style.display = "block";
			
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == 'triggers') {
			this.setModeData(true);

			this.currentView = "Triggers";

			this.modelCommandMenu.items.clear();

			this.groupidx = 0;

			this.modelCommandMenu.items.push({'label': "< " + $L("Group"), 'command': "triggers-prev", 'disabled': true});

			this.modelCommandMenu.items.push({'label': $L("Add Trigger"), 'command': "triggers-add", 'disabled': false});

			if(this.loaded.triggers[0].list.length == 0)
				this.modelCommandMenu.items.push({'label': $L("Group") + " >", 'command': "triggers-next", 'disabled': true});
			else
				this.modelCommandMenu.items.push({'label': $L("Group") + " >", 'command': "triggers-next", 'disabled': false});			

			this.controller.modelChanged(this.modelCommandMenu, this);

			this.mode.triggers.clear();

			for(var i = 1; i < this.loaded.triggers.length; i++) {
				if(this.loaded.triggers[i].list.length == 0)
					this.loaded.triggers.splice(i--, 1);
			}

			for(var i = 0; i < this.loaded.triggers[0].list.length; i++) {
				var id = this.loaded.triggers[0].list[i].extension;
				var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

				var trigger = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};

				trigger[id] = [this.loaded.triggers[0].list[i]];

				trigger['extension'] = this.loaded.triggers[0].list[i].extension;

				this.mode.triggers.push(trigger);
			}

			this.controller.modelChanged(this.modelTriggersList, this);

			this.configurationView.style.display = "none";
			this.triggersView.style.display = "block";
			
			this.controller.sceneScroller.mojo.revealTop(0);

			var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
	
			transition.run();
		}
		else if(event.command == "settings-add") {
			var settingItems = [];

			for(var i = 0; i < this.extensions.settings.length; i++) {
				if(this.loaded.settings.search("extension", this.extensions.settings[i]) == -1) {
					var label = this.settingsConfig[this.extensions.settings[i]].label();
				
					if(label != undefined)
						settingItems.push({'label': label, 'command': i});
				}
			}

			settingItems.sort(this.sortAlphabeticallyFunction);

			this.controller.popupSubmenu({
				'onChoose': this.handleSettingsChoose.bind(this), 'items': settingItems});
		}
		else if(event.command == "settings-all") {
			this.modelCommandMenu.items[0].disabled = true;
			this.modelCommandMenu.items[1].disabled = true;
			this.modelCommandMenu.items[2].disabled = false;

			this.controller.modelChanged(this.modelCommandMenu, this);

			this.mode.settings.clear();

			this.loaded.settings.clear();
		
			this.retrieveCurrentSettings(0, "everything");
		}	
		else if(event.command == "settings-none") {
			this.modelCommandMenu.items[0].disabled = false;
			this.modelCommandMenu.items[1].disabled = false;
			this.modelCommandMenu.items[2].disabled = true;

			this.controller.modelChanged(this.modelCommandMenu, this);

			this.mode.settings.clear();

			this.loaded.settings.clear();
						
			this.setModeData(true);
		}
		else if(event.command == "applications-app") {
			this.controller.serviceRequest('palm://org.webosinternals.modeswitcher.sys/', {
				'method': 'systemCall', 'parameters': {'id': "com.palm.applicationManager",
				'service': "com.palm.applicationManager", 'method': "listLaunchPoints", 'params': {}},
				'onSuccess': function(payload) {
					var appItems = [];

					this.launchPoints = payload.launchPoints;
				
					this.launchPoints.sort(this.sortAlphabeticallyFunction);
				
					this.launchPoints.each(function(item, index){
						if((this.extensions.actions.indexOf("default") != -1) &&
							(item.id != "org.webosinternals.modeswitcher") &&
							((item.id != "com.palm.app.contacts") || (!item.params)))
						{
							appItems.push({'label': item.title, 'command': index});
						}
					}.bind(this));

					this.controller.popupSubmenu({
						'onChoose':  this.handleAppSrvChoose.bind(this, "app"), 'items': appItems});
				}.bind(this)});
		}
		else if(event.command == "applications-ms") {
			if(this.actionsConfig.modesw != undefined) {
				var id = "modesw";
				var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

				var launchpoint = {'title': "Mode Switcher"};

				var data = this.actionsConfig[id].config(launchpoint);
		
				data.extension = id;

				this.loaded.actions.splice(0, 0, data);

				var appsrv = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};
		
				appsrv[id] = [data]; 

				this.mode.actions.list.splice(0, 0, appsrv);

				this.controller.setupWidget(element, {
					'itemTemplate': '../extensions/actions/' + id + '-listitem',
					'swipeToDelete': false, 'autoconfirmDelete': false,
					'reorderable': false, 'itemsProperty': id});

				this.setModeData(true);
			}
		}
		else if(event.command == "applications-srv") {
			this.controller.serviceRequest('palm://org.webosinternals.modeswitcher.sys/', {
				'method': 'systemCall', 'parameters': {'id': "com.palm.applicationManager",
				'service': "com.palm.applicationManager", 'method': "listLaunchPoints", 'params': {}},
				'onSuccess': function(payload) {
					var appItems = [];

					this.launchPoints = payload.launchPoints;
				
					this.launchPoints.sort(this.sortAlphabeticallyFunction);
				
					this.launchPoints.each(function(item, index){
						for(var i = 0; i < this.extensions.actions.length; i++) {
							var appid = this.actionsConfig[this.extensions.actions[i]].appid("srv");

							if((appid != undefined) && (appid == item.id)) {
								appItems.push({'label': item.title, 'command': index});
							
								break;
							}
						}
					}.bind(this));

					this.controller.popupSubmenu({
						'onChoose':  this.handleAppSrvChoose.bind(this, "srv"), 'items': appItems});
				}.bind(this)});
		}
		else if(event.command == "triggers-add") {
			var triggerItems = [];
			
			for(var i = 0; i < this.extensions.triggers.length; i++) {
				var label = this.triggersConfig[this.extensions.triggers[i]].label();
				
				if(label != undefined)
					triggerItems.push({'label': label, 'command': i});
			}

			triggerItems.sort(this.sortAlphabeticallyFunction);
	
			this.controller.popupSubmenu({
				'onChoose':  this.handleTriggersChoose.bind(this), 'items': triggerItems});
		}
		else if(event.command == "triggers-prev") {
			if(this.groupidx == 0)
				return;

			if(this.loaded.triggers[this.groupidx].list.length == 0)
				this.loaded.triggers.splice(this.groupidx, 1);				

			this.groupidx--;
		
			if(this.groupidx == 0)
				this.modelCommandMenu.items[0].disabled = true;
			else
				this.modelCommandMenu.items[0].disabled = false;
				
			if(this.loaded.triggers[this.groupidx].list.length == 0)
				this.modelCommandMenu.items[2].disabled = true;
			else
				this.modelCommandMenu.items[2].disabled = false;
			
			this.controller.modelChanged(this.modelCommandMenu, this);
					
			this.modelRequiredSelector.value = this.loaded.triggers[this.groupidx].require;
			this.controller.modelChanged(this.modelRequiredSelector, this);

			this.mode.triggers.clear();
		
			for(var i = 0; i < this.loaded.triggers[this.groupidx].list.length; i++) {
				var id = this.loaded.triggers[this.groupidx].list[i].extension;
				var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

				var trigger = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};

				trigger[id] = [this.loaded.triggers[this.groupidx].list[i]];

				trigger['extension'] = this.loaded.triggers[this.groupidx].list[i].extension;

				this.mode.triggers.push(trigger);
			}

			this.controller.modelChanged(this.modelTriggersList, this);
		}
		else if(event.command == "triggers-next") {
			if(this.loaded.triggers[this.groupidx].list.length == 0) {
				if(this.groupidx == (this.loaded.triggers.length - 1))
					return;
				else
					this.loaded.triggers.splice(this.groupidx, 1);				
			}
			else
				this.groupidx++;

			if(this.groupidx == 0)
				this.modelCommandMenu.items[0].disabled = true;
			else
				this.modelCommandMenu.items[0].disabled = false;

			if(this.loaded.triggers.length <= this.groupidx) {
				this.loaded.triggers.push({require: 0, list: []});
				
				this.groupidx = this.loaded.triggers.length - 1;
			}

			if(this.loaded.triggers[this.groupidx].list.length == 0)
				this.modelCommandMenu.items[2].disabled = true;			
			else
				this.modelCommandMenu.items[2].disabled = false;			

			this.controller.modelChanged(this.modelCommandMenu, this);
		
			this.modelRequiredSelector.value = this.loaded.triggers[this.groupidx].require;
			this.controller.modelChanged(this.modelRequiredSelector, this);
		
			this.mode.triggers.clear();
		
			for(var i = 0; i < this.loaded.triggers[this.groupidx].list.length; i++) {
				var id = this.loaded.triggers[this.groupidx].list[i].extension;
				var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

				var trigger = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};

				trigger[id] = [this.loaded.triggers[this.groupidx].list[i]];

				trigger['extension'] = this.loaded.triggers[this.groupidx].list[i].extension;

				this.mode.triggers.push(trigger);
			}

			this.controller.modelChanged(this.modelTriggersList, this);
		}
		else if(event.command == "launchpoint") {
			if(this.modelNameText.value != "") {
				this.controller.serviceRequest('palm://com.palm.applicationManager/', {
					'method': "addLaunchPoint", 'parameters': {'id': Mojo.Controller.appInfo.id,
						'icon': "images/default_icon.png", 'title': this.modelNameText.value,
						'params': {'action': "toggle", 'name': this.modelNameText.value}}});
			}
		}
		else if(event.command == "export") {
			var mode = this.setModeData(false);
		
			this.controller.stageController.pushScene("gdm", "exportGDoc", "Mode Config", "[MSCFG] -", 
				{title: "Mode Switcher v" + this.cfgVersion + " - " + mode.name, body: mode}, null);
		}
		else if(event.command == "import") {
			var mode = this.setModeData(false);
		
			this.controller.stageController.pushScene("gdm", "importGDoc", "Mode Config", "[MSCFG] -", 
				{title: "Mode Switcher v"}, this.importModeConfig.bind(this));
		}
		else if(event.command == "status") {
			this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
				method: 'status', parameters: {mode: this.mode.name},
				onComplete: function(response) {
					if((response) && (response.groups) && (response.triggers)) {
						this.showStatusInfo(response, 0);
					}
				}.bind(this)});					
		}
		else if(event.command == "help") {
			this.controller.stageController.pushScene("support", this.customModes);
		}
	}
}

ModeAssistant.prototype.showStatusInfo = function(status, group) {
	if(group == status.groups.length)
		group = 0;

	if(this.mode.triggers.length == 0)
		var text = "Status info not available since this mode has no triggers.";
	else {
		if(status.groups[group])
			var state = "Valid";
		else
			var state = "Not Valid";
	
		var choices = [{label:$L("Next Group"), value:"group", type:'default'}, {label:$L("Close"), value:"close", type:'default'}];
		var text = "<div style='float:left;'><b>Current state for Group " + group + ":</b></div><div style='float:right;'>" + 
			state + "</div><br><br>";
	
		for(var i = 0; i < status.triggers.length; i++) {
			if(status.triggers[i].group == group) {
				text += "<div style='float:left;'><b>Trigger - " + status.triggers[i].extension + 
					":</b></div><div style='float:right;'>" + status.triggers[i].state.toString().toUpperCase() + "</div><br>";
			}
		}
	}
	
	this.controller.showAlertDialog({
		title: this.mode.name + " " + $L("Status"),
		message: text,
		choices: choices,
		preventCancel: true,
		allowHTMLMessage: true,
		onChoose: function(status, group, value) {
			if(value == "group")
				this.showStatusInfo(status, ++group);
		}.bind(this, status, group)}); 
}

//

ModeAssistant.prototype.handleSettingsChoose = function(index) {
	if(index != undefined) {
		if(this.loaded.settings.length == 0)
			this.modelCommandMenu.items[2].disabled = false;
		
		if(this.loaded.settings.length == this.extensions.settings.length - 1) {
			this.modelCommandMenu.items[0].disabled = true;
			this.modelCommandMenu.items[1].disabled = true;
		}
		
		this.controller.modelChanged(this.modelCommandMenu, this);
	
		this.retrieveCurrentSettings(index, "single");
	}
}

ModeAssistant.prototype.handleAppSrvChoose = function(type, index) {
	if(index != undefined) {
		var id = "default";

		for(var key in this.actionsConfig) {
			if(this.actionsConfig[key].appid(type) == this.launchPoints[index].id) {
				id = key;
				break;
			}
		}
		
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";
		
		this.launchPoints[index].type = type;
		
		var data = this.actionsConfig[id].config(this.launchPoints[index]);
		
		data.extension = id;

		this.loaded.actions.push(data);

		var appsrv = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};
		
		appsrv[id] = [data]; 

		this.mode.actions.list.push(appsrv);

		this.controller.setupWidget(element, {
			'itemTemplate': '../extensions/actions/' + id + '-listitem',
			'swipeToDelete': false, 'autoconfirmDelete': false,
			'reorderable': false, 'itemsProperty': id});

		this.setModeData(true);
	}
}

ModeAssistant.prototype.handleTriggersChoose = function(index) {
	if(index != undefined) {
		this.modelCommandMenu.items[2].disabled = false;

		this.controller.modelChanged(this.modelCommandMenu, this);

		var data = this.triggersConfig[this.extensions.triggers[index]].config();

		data.extension = this.extensions.triggers[index];

		this.loaded.triggers[this.groupidx].list.push(data);

		this.loaded.triggers[this.groupidx].list.sort(this.sortAlphabeticallyFunction);

		var id = this.extensions.triggers[index];
		var element = id.charAt(0).toUpperCase() + id.slice(1) + "List";

		var trigger = {'list': "<div name='" + element + "' x-mojo-element='List'></div>"};

		trigger[id] = [data];
	
		trigger['extension'] = this.extensions.triggers[index];
	
		this.mode.triggers.push(trigger);

		this.mode.triggers.sort(this.sortAlphabeticallyFunction);
		
		this.setModeData(true);
	}
}

//

ModeAssistant.prototype.handleListChange = function(list, event) {
	if(event != undefined) {
		if(event.model == undefined) {
			// Sliders don't have model with them.
		
			this.setModeData(true);
		}
	}
}

ModeAssistant.prototype.handleListReorder = function(list, event) {
	if(list == "apps") {
		var tempApp = this.mode.actions.list[event.fromIndex];
	
		this.mode.actions.list.splice(event.fromIndex, 1);
		this.mode.actions.list.splice(event.toIndex, 0, tempApp);

		var tempApp = this.loaded.actions[event.fromIndex];
	
		this.loaded.actions.splice(event.fromIndex, 1);
		this.loaded.actions.splice(event.toIndex, 0, tempApp);
	}
	
	this.setModeData(false);
}

ModeAssistant.prototype.handleListDelete = function(list, event) {
	if(list == "settings") {
		if(this.retrieving) {
			this.controller.modelChanged(this, this.modelSettingsList);
			return;
		}

		this.mode.settings.splice(event.index,1);

		this.loaded.settings.splice(event.index,1);

		this.modelCommandMenu.items[0].disabled = false;
		this.modelCommandMenu.items[1].disabled = false;
					
		if(this.loaded.settings.length == 0)
			this.modelCommandMenu.items[2].disabled = true;

		this.controller.modelChanged(this.modelCommandMenu, this);
		
		this.setModeData(false);
	}
	else if(list == "apps") {
		this.mode.actions.list.splice(event.index,1);

		this.loaded.actions.splice(event.index,1);
	}
	else if(list == "triggers") {
		for(var i = 0; i < this.loaded.triggers[this.groupidx].list.length; i++) {
			var deleted = this.mode.triggers[event.index][this.mode.triggers[event.index].extension][0];
			if(this.loaded.triggers[this.groupidx].list[i] == deleted) {
				this.loaded.triggers[this.groupidx].list.splice(i, 1);
				
				break;
			}
		}

		if((this.groupidx == (this.loaded.triggers.length - 1)) && 
			(this.loaded.triggers[this.groupidx].list.length == 0))
		{
			this.modelCommandMenu.items[2].disabled = true;
			
			this.controller.modelChanged(this.modelCommandMenu, this);
		}

		this.mode.triggers.splice(event.index,1);

		this.setModeData(false);
	}
}

//

ModeAssistant.prototype.checkModeName = function() {
	if(this.modelNameText.value.length == 0)
		this.modelNameText.value = $L("New Mode");

	if((this.modelNameText.value == "Current Mode") || 
		(this.modelNameText.value == "Default Mode") || 
		(this.modelNameText.value == "Previous Mode") ||
		(this.modelNameText.value == "All Modes") ||
		(this.modelNameText.value == "All Normal Modes") ||
		(this.modelNameText.value == "All Modifier Modes") ||
		(this.modelNameText.value == "Any Normal Mode") ||
		(this.modelNameText.value == "Any Modifier Mode"))
	{
		this.modelNameText.value = $L("Reserved Mode Name");
	}

	for(var i = 0; i < 100; i++) {
		if(i == 0)
			var name = this.modelNameText.value;
		else
			var name = this.modelNameText.value + "-" + i;
	
		var exists = false;
		
		for(var j = 0 ; j < this.customModes.length ; j++) {
			if((j != this.modeIndex) && (this.customModes[j].name == name)) {
				exists = true;
				break;
			}
		}
		
		if(exists)
			continue;
		else {
			if(i > 0)
				this.modelNameText.value = name;
			
			break;
		}
	}

	this.controller.modelChanged(this.modelNameText, this);

	// Rename the mode also in MS app configurations if any exists

	if((this.modelNameText.value != this.mode.name) && (this.mode.name != "")) {
		for(var i = 0; i < this.customModes.length; i++) {
			for(var j = 0; j < this.customModes[i].actions.list.length; j++) {
				if((this.customModes[i].actions.list[j].type == "ms") &&
					(this.customModes[i].actions.list[j].mode == this.mode.name))
				{
					this.customModes[i].actions.list[j].mode = this.modelNameText.value;
				}
			}
		}
	}
}

//

ModeAssistant.prototype.sortAlphabeticallyFunction = function(a,b){
	if(a.type != undefined) {
		var c = a.type.toLowerCase();
		var d = b.type.toLowerCase();
	}
	else if(a.label != undefined) {
		var c = a.label.toLowerCase();
		var d = b.label.toLowerCase();
	}
	else if(a.title != undefined) {
		var c = a.title.toLowerCase();
		var d = b.title.toLowerCase();
	}
	else if(a.extension != undefined) {
		var c = a.extension.toLowerCase();
		var d = b.extension.toLowerCase();
	}

	return ((c < d) ? -1 : ((c > d) ? 1 : 0));
}

//

ModeAssistant.prototype.importModeConfig = function(data) {
	var version = data.title.slice(15, 18);

	if(version != this.cfgVersion) {
		this.controller.showAlertDialog({
			title: $L("Configuration Version Error"),
			message: "The version of the mode configuration that you are trying to import is not supported.",
			choices:[
				{label:$L("Close"), value:"close", type:'default'}],
			preventCancel: true,
			allowHTMLMessage: true,
			onChoose: function(value) {
			}.bind(this)}); 
	}
	else {
		var mode = data.body;

		this.controller.showAlertDialog({
			title: $L("Confirm Config Importing"),
			message: "<div align='justify'>" + $L("You are about to override configuration of this mode.") + "</div>",
			choices:[
				{label:$L("Continue"), value:"continue", type:'default'},
				{label:$L("Cancel"), value:"cancel", type:'default'}],
			preventCancel: true,
			allowHTMLMessage: true,
			onChoose: function(mode, value) {
				var importError = false;
			
				if(value == "continue") {
					if((mode.actions != undefined) && (mode.actions.list != undefined) &&
						(mode.actions.start != undefined) && (mode.actions.close != undefined) && 
						(mode.settings != undefined) && (mode.triggers != undefined))
					{
						if((mode.name == undefined) || (mode.name.length == 0) || 
							(mode.name == "Current Mode") || (mode.name == "Previous Mode") ||
							(mode.name == "All Modes") || (mode.name == "All Normal Modes") ||
							(mode.name == "All Modifier Modes") || (mode.name == "Any Normal Mode") ||
							(mode.name == "Any Modifier Mode"))
						{
							importError = true;
						}
						else if((mode.name == "Default Mode") && (mode.type == "default") &&
							(mode.startup != undefined) && (mode.start != undefined) && (mode.notify != undefined))
						{
							if(this.modeIndex == 0) {
								this.customModes.splice(0, 1, mode);

								this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
									method: 'prefs', parameters: {customModes: this.customModes},
									onComplete: function() {
										this.controller.stageController.popScene({'customModes': this.customModes, 'modeIndex': this.modeIndex});
									}.bind(this)});
								
								return;
							}
						}
						else if(((mode.type == "normal") || (mode.type == "modifier")) &&
							(mode.start != undefined) && (mode.close != undefined) && (mode.notify != undefined))
						{
							if(this.modeIndex != 0) {
								if(this.modeIndex == undefined) {
									this.modeIndex = this.customModes.length;
									this.customModes.push(mode);
								}
								else	
									this.customModes.splice(this.modeIndex, 1, mode);
						
								this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
									method: 'prefs', parameters: {customModes: this.customModes},
									onComplete: function() {
										this.controller.stageController.popScene({'customModes': this.customModes, 'modeIndex': this.modeIndex});
									}.bind(this)});

								return;
							}
						}
						else
							importError = true;
					}
					else
						importError = true;
				}
				
				if(importError) {
					this.controller.showAlertDialog({
						title: $L("Configuration Import Error"),
						message: "There was error while importing mode configuration, most likely the configuration you tried to import was malformed.",
						choices:[
							{label:$L("Close"), value:"close", type:'default'}],
						preventCancel: true,
						allowHTMLMessage: true,
						onChoose: function(value) {
						}.bind(this)}); 
				}
			}.bind(this, mode)});
	}
}

ModeAssistant.prototype.govnahProfiles = function(profiles) {
	if(this.actionsConfig["govnah"] != undefined)
		this.actionsConfig["govnah"].data(profiles);
}

//

ModeAssistant.prototype.activate = function(event) {
	/* Put in event handlers here that should only be in effect when this scene is active. 
	 *	For  example, key handlers that are observing the document. 
	 */
}
	
ModeAssistant.prototype.deactivate = function(event) {
	/* Remove any event handlers you added in activate and do any other cleanup that should 
	 * happen before this scene is popped or another scene is pushed on top. 
	 */
}

ModeAssistant.prototype.cleanup = function(event) {
	/* This function should do any cleanup needed before the scene is destroyed as a result
	 * of being popped off the scene stack.
	 */
}

