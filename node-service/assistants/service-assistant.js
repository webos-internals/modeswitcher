MainServiceAssistant = function() {
}

//

MainServiceAssistant.prototype.setup = function() {
	this.queue = {controls: [], executes: [], triggers: []};
}

MainServiceAssistant.prototype.cleanup = function() {
}

//

MainServiceAssistant.prototype.appendControl = function(future, args, run) {
	this.queue.controls.push({future: future, args: args, run: run});
		
	if((this.queue.controls.length == 1) && 
		(this.queue.executes.length == 0) && 
		(this.queue.triggers.length == 0))
	{
		this.processControl();
	}
}

MainServiceAssistant.prototype.processControl = function() {
	var future = new Future();

	var control = this.queue.controls[0];
	
	future.now(this, function(future) {
		control.run(future, control.args);
	}).then(this, function(future) {
		control.future.result = { returnValue: true };
		
		this.queue.controls.shift();

		if(this.queue.controls.length > 0)
			this.processControl();
		else {
			if(this.queue.executes.length > 0)
				this.processExecute();
			
			if(this.queue.triggers.length > 0)
				this.processTrigger();
		}
	});			
}

//

MainServiceAssistant.prototype.appendExecute = function(future, args, run) {
	this.queue.executes.push({future: future, args: args, run: run});
		
	if((this.queue.controls.length == 0) && (this.queue.executes.length == 1))
		this.processExecute();
}

MainServiceAssistant.prototype.processExecute = function() {
	var future = new Future();

	var execute = this.queue.executes[0];
	
	future.now(this, function(future) {
		execute.run(future, execute.args);
	}).then(this, function(future) {
		execute.future.result = { returnValue: true };
		
		this.queue.executes.shift();
		
		if(this.queue.executes.length > 0)
			this.processExecute();
		else if(this.queue.controls.length > 0) {
			if(this.queue.triggers.length == 0)
				this.processControl();
		}
	});			
}

//

MainServiceAssistant.prototype.appendTrigger = function(future, args, run) {
	this.queue.triggers.push({future: future, args: args, run: run});
		
	if((this.queue.controls.length == 0) && (this.queue.triggers.length == 1))
		this.processTrigger();
}

MainServiceAssistant.prototype.processTrigger = function() {
	var future = new Future();

	var trigger = this.queue.triggers[0];
	
	future.now(this, function(future) {
		trigger.run(future, trigger.args);
	}).then(this, function(future) {
		trigger.future.result = { returnValue: true };
		
		this.queue.triggers.shift();
		
		if(this.queue.triggers.length > 0)
			this.processTrigger();
		else if(this.queue.controls.length > 0) {
			if(this.queue.executes.length == 0)
				this.processControl();
		}
	});			
}

