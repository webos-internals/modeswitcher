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

	this.modelBannerButton = { value: this.prefs.notifications, disabled: false };

	this.controller.setupWidget("InfoBannerButton", 
		{falseValue: false, falseLabel: $L("Off"), trueValue: true, trueLabel: $L("On")},
      this.modelBannerButton);

	Mojo.Event.listen(this.controller.get('InfoBannerButton'), 
		Mojo.Event.propertyChange, this.savePreferences.bind(this));

	this.modelDelaysButton = {buttonClass: '', disabled: false};

	this.controller.setupWidget('TriggerDelaysButton', 
		{label: $L("Trigger Delay Preferences")}, this.modelDelaysButton);

	Mojo.Event.listen(this.controller.get('TriggerDelaysButton'), 
		Mojo.Event.tap, this.informUser.bind(this));
}

PrefsAssistant.prototype.informUser = function() {
	this.modelViewButton.value = true;
	
	this.controller.modelChanged(this.modelViewButton, this);
	
	this.controller.showAlertDialog({
		title: $L("Not Yet Implemented"),
			message: "<div align='justify'>" + 
				$L("This option will be enabled in future versions.") + "</div>",
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

