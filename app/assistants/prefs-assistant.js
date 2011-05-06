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
		Mojo.Event.propertyChange, this.advancedInfo.bind(this));

	this.modelSettingsButton = {buttonClass: '', disabled: true};

	this.controller.setupWidget('SettingsPrefsButton', 
		{label: $L("Setting Extensions")}, this.modelSettingsButton);

	this.modelActionsButton = {buttonClass: '', disabled: true};

	this.controller.setupWidget('ActionsPrefsButton', 
		{label: $L("Action Extensions")}, this.modelActionsButton);

	this.modelTriggersButton = {buttonClass: '', disabled: true};

	this.controller.setupWidget('TriggersPrefsButton', 
		{label: $L("Trigger Extensions")}, this.modelTriggersButton);
}

PrefsAssistant.prototype.advancedInfo = function() {
	if(this.modelSettingsButton.value) {
		this.controller.showAlertDialog({
			title: $L("Advanced Features"),
				message: "<div align='justify'>" + 
					$L("Make sure that you have installed all <b>Advanced System Prefs</b> patches before enabling this option! See the wiki for details about the required patches!") + "<br><br>" +
					$L("You can install <b>Uber Calendar</b> patch instead of <b>Advanced System Prefs - Calendar Prefs</b> patch if you want.") + "</div>",
				choices:[{label:$L("Continue"), value:"ok", type:'default'}, {label:$L("Cancel"), value:"cancel", type:'default'}],
				preventCancel: true,
				allowHTMLMessage: true,
				onChoose: function(value) {
					if(value == "cancel")
						this.modelSettingsButton.value = false;
					else 
						this.modelSettingsButton.value = true;
					
					this.controller.modelChanged(this.modelSettingsButton, this);
					
					this.savePreferences();
				}.bind(this)}); 
	}
	else
		this.savePreferences();
}

PrefsAssistant.prototype.loadPreferences = function() {
	this.cookie = new Mojo.Model.Cookie('preferences');

	this.prefs = this.cookie.get();
	
	if(!this.prefs) {
		this.prefs = { 'advancedPrefs': false };
	}
}

PrefsAssistant.prototype.savePreferences = function() {
	this.prefs.advancedPrefs = this.modelSettingsButton.value;
	
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

