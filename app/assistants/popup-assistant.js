/*
 *    PopupAssistant - The Actual Mode Launcher Scene
*/


function PopupAssistant(view, params) {
	/* This is the creator function for your scene assistant object. It will be passed all the 
	 * additional parameters (after the scene name) that were passed to pushScene. The reference
	 * to the scene controller (this.controller) has not be established yet, so any initialization
	 * that needs the scene controller should be done in the setup function below. 
	 */

	this.appControl = Mojo.Controller.getAppController();
	this.appAssistant = this.appControl.assistant;

	this.view = view;

	this.modeName = params.name;

	if(view == "popup") {
		this.startModes = params.modes.start;
		this.closeModes = params.modes.close;

		this.modifiers = params.modes.modifiers;

		this.startTimer = params.timers.start / 1000;
		this.closeTimer = params.timers.close / 1000;
	
		if(this.startModes.length > 0)
			this.event = "start";
		else
			this.event = "close";

		this.modeidx = 0;
	}
}    

PopupAssistant.prototype.setup = function() {
	/* This function is for setup tasks that have to happen when the scene is first created
	 * Use Mojo.View.render to render view templates and add them to the scene, if needed.
    * Setup widgets and add event handlers to listen to events from widgets here. 
    */

	this.controller.get(this.view).show();

	// Buttons
	
	if(this.event == "start")
		this.modelStartButton = {label: $L("Switch Mode"), buttonClass : 'affirmative popupbutton', disabled : false};
   else
   	this.modelStartButton = {label: $L("Close Mode"), buttonClass : 'affirmative popupbutton', disabled : false};
   	     
	this.controller.setupWidget('StartButton', {}, this.modelStartButton);

	Mojo.Event.listen(this.controller.get('StartButton'), Mojo.Event.tap, 
		this.handleStartButtonPress.bind(this));

	this.modelSelectButton = {label: $L("Default Mode"), buttonClass : 'popupbutton', disabled : false};
  
   this.controller.setupWidget('SelectButton', {}, this.modelSelectButton);

	Mojo.Event.listen(this.controller.get('SelectButton'), Mojo.Event.tap, 
		this.handleSelectButtonPress.bind(this));
   
 	this.modelCancelButton = {label: $L("Cancel"), buttonClass : 'negative popupbutton', disabled : false};

	this.controller.setupWidget('CancelButton', {}, this.modelCancelButton);

	Mojo.Event.listen(this.controller.get('CancelButton'), Mojo.Event.tap, 
		this.handleCancelButtonPress.bind(this));
	
	if(this.view == "popup") {
		if(this.event == "start")
			this.setupStart();
		else
			this.setupClose();
	}
	else if(this.view == "toggle") {
		this.controller.document.body.style.backgroundColor = "#000000";

		this.controller.get("modeName").update(this.modeName);
	}
}

PopupAssistant.prototype.setupStart = function() {
	clearTimeout(this.timer);

	this.modelStartButton.label = $L("Switch Mode");
		
	this.controller.modelChanged(this.modelStartButton, this);

	this.counterCancel = this.startTimer;
	this.counterStart = this.startTimer;

	for(var i = 0 ; i < this.startModes.length ; i++)
	{
		if(this.startModes[i].start == 2)
		{
			this.modeidx = i;

			this.modelSelectButton.label = this.startModes[i].name;
			this.controller.modelChanged(this.modelSelectButton, this);
	
			this.updateStartTimer();
			
			return;
		}
	}

	this.modelSelectButton.label = this.startModes[this.modeidx].name;
	this.controller.modelChanged(this.modelSelectButton, this);

	if(this.counterCancel > 0)
		this.updateCancelTimer();
	else {
		this.event = "cancel";			
		this.controller.window.close();
	}
}

PopupAssistant.prototype.setupClose = function() {
	clearTimeout(this.timer);

	this.modelStartButton.label = $L("Close Mode");
		
	this.controller.modelChanged(this.modelStartButton, this);

	this.modelSelectButton.label = this.closeModes[0].name;
	
	this.controller.modelChanged(this.modelSelectButton, this);
	
	this.counterCancel = this.closeTimer;
	this.counterClose = this.closeTimer;

	if(this.closeModes[0].close == 2)
	{
		this.updateCloseTimer();
		
		return;
	}

	if(this.counterCancel > 0)
		this.updateCancelTimer();
	else {
		this.event = "cancel";
		this.controller.window.close();
	}
}

PopupAssistant.prototype.updateCancelTimer = function() {
	if(this.counterCancel >= 0) {
		this.modelCancelButton.label = $L("Cancel") + " (" + this.counterCancel-- + ")";
		this.controller.modelChanged(this.modelCancelButton, this);
		
		this.timer = setTimeout(this.updateCancelTimer.bind(this), 1000);
	}
	else
		this.handleCancelButtonPress();
}

PopupAssistant.prototype.updateStartTimer = function() {
	if(this.counterStart >= 0) {
		this.modelStartButton.label = $L("Switch Mode") + " (" + this.counterStart-- + ")";
			
		this.controller.modelChanged(this.modelStartButton, this);
		
		this.timer = setTimeout(this.updateStartTimer.bind(this), 1000);
	}
	else
		this.handleStartButtonPress();
}

PopupAssistant.prototype.updateCloseTimer = function() {
	if(this.counterClose >= 0) {
		this.modelStartButton.label = $L("Close Mode") + " (" + this.counterClose-- + ")";
		this.controller.modelChanged(this.modelStartButton, this);
		
		this.timer = setTimeout(this.updateCloseTimer.bind(this), 1000);
	}
	else
		this.handleStartButtonPress();
}

PopupAssistant.prototype.handleStartButtonPress = function() {
	clearTimeout(this.timer);

	this.controller.window.close();
}

PopupAssistant.prototype.handleSelectButtonPress = function() {
	clearTimeout(this.timer);

	if(this.event == "start") {
		this.modelStartButton.label = $L("Switch Mode");
		
		this.controller.modelChanged(this.modelStartButton, this);

		this.modelCancelButton.label = $L("Cancel");
		this.controller.modelChanged(this.modelCancelButton, this);

		this.modeidx++;
	
		if(this.modeidx == this.startModes.length)
			this.modeidx = 0;

		this.modelSelectButton.label = this.startModes[this.modeidx].name;
		this.controller.modelChanged(this.modelSelectButton, this);
	}
}

PopupAssistant.prototype.handleCancelButtonPress = function() {
	clearTimeout(this.timer);
	
	if((this.event == "start") && (this.closeModes.length > 0)) {
		// FIXME: There should be some effect so user notices easily this!

		this.event = "close";
	
		this.setupClose();
	}
	else {
		this.event = "cancel";
		
		this.controller.window.close();
	}
}

PopupAssistant.prototype.close = function() {
	this.controller.window.close();
}

PopupAssistant.prototype.activate = function(event) {
	/* Put in event handlers here that should only be in effect when this scene is active. 
	 *	For  example, key handlers that are observing the document. 
	 */

	if(this.view == "popup") {
		if(this.event == "start")
			var timeout = this.startTimer * 1000 + 5000;
		else
			var timeout = this.closeTimer * 1000 + 5000;

		this.controller.serviceRequest("palm://com.palm.power/com/palm/power", {
			'method': "activityStart", 'parameters': {'id': Mojo.Controller.appInfo.id,
			'duration_ms': timeout} });
	}
	else if(this.view == "toggle") {
		this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", {
			method: 'execute', parameters: {action: "toggle", name: this.modeName},
			onComplete: function() {
				setTimeout(this.close.bind(this), 500);
			}.bind(this)});
	}
}
	
PopupAssistant.prototype.deactivate = function(event) {
	/* Remove any event handlers you added in activate and do any other cleanup that should 
	 * happen before this scene is popped or another scene is pushed on top. 
	 */
}

PopupAssistant.prototype.cleanup = function(event) {
	/* This function should do any cleanup needed before the scene is destroyed as a result
	 * of being popped off the scene stack.
	 */    

	if(this.view == "popup") {
		var newModes = [];
	
		if(this.event == "start")
			newModes.push(this.startModes[this.modeidx].name);
		else if(this.event == "close")
			newModes.push("Default Mode");		
	
		newModes = newModes.concat(this.modifiers);

		if(this.event != "cancel") {
			this.controller.serviceRequest("palm://org.webosinternals.modeswitcher.srv", { 
				'method': "execute", 'parameters': {'action': "update", 'names': newModes, 'popup': true}});
		}
	}
}

