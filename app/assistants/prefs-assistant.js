function PrefsAssistant() {
}

//

PrefsAssistant.prototype.setup = function() {
	this.loadPreferences();

	this.modelSettingsButton = { value: this.prefs.advancedPrefs, disabled: false };

	this.controller.setupWidget("AdvancedSettingsButton", 
		{falseValue: false, falseLabel: $L("Off"), trueValue: true, trueLabel: $L("On")},
      this.modelSettingsButton);

	Mojo.Event.listen(this.controller.get('AdvancedSettingsButton'), 
		Mojo.Event.propertyChange, this.savePreferences.bind(this));

	this.modelViewButton = { value: true, disabled: false };

	this.controller.setupWidget("AdvancedViewButton", 
		{falseValue: false, falseLabel: $L("Off"), trueValue: true, trueLabel: $L("On")},
      this.modelViewButton);

	Mojo.Event.listen(this.controller.get('AdvancedViewButton'), 
		Mojo.Event.propertyChange, this.informUser.bind(this));

	this.modelHelpButton = { value: false, disabled: false };

	this.controller.setupWidget("HelpShortcutsButton", 
		{falseValue: false, falseLabel: $L("Off"), trueValue: true, trueLabel: $L("On")},
      this.modelHelpButton);

	Mojo.Event.listen(this.controller.get('HelpShortcutsButton'), 
		Mojo.Event.propertyChange, this.informUser.bind(this));

	this.modelBannerButton = { value: this.prefs.notifications, disabled: false };

	this.controller.setupWidget("InfoBannerButton", 
		{falseValue: false, falseLabel: $L("Off"), trueValue: true, trueLabel: $L("On")},
      this.modelBannerButton);

	Mojo.Event.listen(this.controller.get('InfoBannerButton'), 
		Mojo.Event.propertyChange, this.savePreferences.bind(this));
}
PrefsAssistant.prototype.informUser = function() {
	this.modelViewButton.value = true;
	this.modelHelpButton.value = false;
	
	this.controller.modelChanged(this.modelViewButton, this);
	this.controller.modelChanged(this.modelHelpButton, this);
	
	this.controller.showAlertDialog({
		title: $L("Not Yet Functional"),
			message: "<div align='justify'>" + 
				$L("This option will be enabled in version 2.1.") + "</div>",
			choices:[{label:$L("Continue"), value:"ok", type:'default'}],
			preventCancel: true,
			allowHTMLMessage: true}); 
}

PrefsAssistant.prototype.loadPreferences = function() {
	this.cookie = new Mojo.Model.Cookie('preferences');

	this.prefs = this.cookie.get();
	
	if(!this.prefs) {
		this.prefs = {
			'advancedPrefs': false, 
			
			'advancedView': true,
			'helpShortcuts': true, 
			'notifications': true };
	}
}

PrefsAssistant.prototype.savePreferences = function() {
	this.prefs.advancedPrefs = this.modelSettingsButton.value;
	this.prefs.notifications = this.modelBannerButton.value;
	
	this.cookie.put(this.prefs);
}

//

PrefsAssistant.prototype.cleanup = function() {
}

//

PrefsAssistant.prototype.activate = function() {
}

PrefsAssistant.prototype.deactivate = function() {
}

