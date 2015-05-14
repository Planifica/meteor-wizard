var wizardsById = {};
var defaultId = '_defaultId';

Template.wizard.rendered = function() {};

Template.wizard.helpers({
  xs: function() {
    if($(document).width() <768){
      return true;
    }
  },
  innerContext: function(outerContext) {
    var context = this,
      wizard = wizardsById[this.id],
      activeStep = wizard.activeStep();

    var innerContext = {
      data: activeStep && activeStep.data,
      wizard: wizardsById[this.id]
    };

    _.extend(innerContext, outerContext);
    return innerContext;
  },
  activeStepClass: function(id) {
    var activeStep = this.wizard.activeStep();
    return (activeStep && activeStep.id == id) && 'active' || '';
  },
  completeStepClass: function(id) {
    var completeStep = $.inArray(id, this.wizard.completeSteps);
    if (this.editMode && this.editMode() === true) {
      return 'complete';
    }
    if (completeStep != -1) {
      return 'complete';
    }
    return '';
  },
  activeStep: function() {
    var activeStep = this.wizard.activeStep();
    return activeStep && Template[activeStep.template] || null;
  },
  showLink: function(id) {
    var activeStep = this.wizard.activeStep();
    var completeStep = $.inArray(id, this.wizard.completeSteps);
    if (this.editMode && this.editMode() === true) {
      return true;
    }
    if ((completeStep != -1) || (activeStep && activeStep.id == id)) {
      return true;
    }
    return false;
  },
  badgeStatus: function(id) {
    var activeStep = this.wizard.activeStep();
    var completeStep = $.inArray(id, this.wizard.completeSteps);
    if (activeStep && activeStep.id == id) {
      return "badge-info";
    }
    if (completeStep != -1) {
      return "badge-success";
    }
    return "";
  },
  stepNumber: function(id) {
    return $.inArray(id, this.wizard._stepsByIndex) + 1;
  }
});


Template.wizard.created = function() {
  var id = this.data.id || defaultId;
  wizardsById[id] = new Wizard(this);
};

Template.wizard.destroyed = function() {
  var id = this.data.id || defaultId;

  if (wizardsById[id]) {
    wizardsById[id].destroy();
    delete wizardsById[id];
  }
};

Template.wizard.events({
  'click .wizardStep.active, click .wizardStep.complete': function() {

    var clickedStep = this.wizard.getStep(this.id);
    var clickedIndex = _.indexOf(this.wizard._stepsByIndex, clickedStep.id);
    var activeStep = this.wizard.activeStep();
    var activeIndex = _.indexOf(this.wizard._stepsByIndex, activeStep.id);

    if (this.wizard.route) {
      // go to clicked step
      var rp = _.extend(this.wizard.routeParams, {step: clickedStep.id});
      Router.go(this.wizard.route, rp);
      return;
    }

    // if clicked step number is smaller go prev
    if (clickedIndex < activeIndex) {
      this.wizard.previous();
    }
    // if clicked step number is bigger go next
    if (clickedIndex > activeIndex) {
      this.wizard.next();
    }
  }
});

var Wizard = function(template) {
  this._dep = new Tracker.Dependency();
  this.template = template;
  this.id = template.data.id;
  this.route = template.data.route;
  this.routeParams = template.data.routeParams || {};
  this.steps = template.data.steps;
  this.completeSteps = [];
  this.editMode = template.data.editMode;

  this._stepsByIndex = [];
  this._stepsById = {};

  this.initialize();
};

Wizard.prototype = {

  constructor: Wizard,

  initialize: function() {
    var self = this;

    _.each(this.steps, function(step) {
      self._initStep(step);
    });

    Tracker.autorun(function() {
      self._setActiveStep();
    });
  },

  _initStep: function(step) {
    var self = this;

    if (!step.id) {
      throw new Error('Step.id is required');
    }

    if (!step.formId) {
      throw new Error('Step.formId is required');
    }

    step._index = this._stepsByIndex.push(step.id)-1;
    this._stepsById[step.id] = _.extend(step, {
      wizard: self,
      data: function() {
        return Session.get(step.id);
      }
    });

    AutoForm.addHooks([step.formId], {
      onSubmit: function(data) {
        if (step.onSubmit) {
          self.setData(step.id, data);
          step.onSubmit.call(self, data, self.mergedData(), self);
        } else {
          if (!step.customSubmit) {
            self.next(data);
          }
        }
        return false;
      }
    });
  },

  _setActiveStep: function() {
    if (this.route && !Router.current()) {
      return;
    }

    // show the first step if not bound to a route
    if (!this.route) {
      return this.show(0);
    }

    var current = Router.current();

    if (!current || (current && current.route.getName() != this.route)) return false;
    var params = current.params,
      index = _.indexOf(this._stepsByIndex, params.step),
      previousStep = this.getStep(index - 1);

    // initial route or non existing step, redirect to first step
    if (!params.step || index === -1) {
      return this.show(0);
    }
    // invalid step
    if (index > 0 && previousStep && !previousStep.data() && this.editMode !== true) {
      return this.show(0);
    }
    // valid
    this.setStep(params.step);
  },

  setData: function(id, data) {
    Session.setPersistent(id, data);
  },

  clearData: function() {
    var self = this;
    _.each(self._stepsById, function(step, id){
      Session.clear(id);
    });
  },

  mergedData: function() {
    var data = {};
    _.each(this._stepsById, function(step) {
      _.extend(data, step.data());
    });
    return data;
  },

  next: function(data) {
    var activeIndex = _.indexOf(this._stepsByIndex, this._activeStepId);

    this.setData(this._activeStepId, data);

    this.show(activeIndex + 1);
  },

  previous: function() {
    var activeIndex = _.indexOf(this._stepsByIndex, this._activeStepId);

    this.setData(this._activeStepId, AutoForm.getFormValues(this.activeStep(false).formId));

    this.show(activeIndex - 1);
  },

  show: function(id) {
    if (typeof id === 'number') {
      id = id in this._stepsByIndex && this._stepsByIndex[id];
    }

    if (!id) return false;

    if (this.route) {
      var rp = _.extend(this.routeParams, {step: id});
      Router.go(this.route, rp);
    } else {
      this.setStep(id);
    }

    return true;
  },

  getStep: function(id) {
    if (typeof id === 'number') {
      id = id in this._stepsByIndex && this._stepsByIndex[id];
    }

    return id in this._stepsById && this._stepsById[id];
  },

  activeStep: function(reactive) {
    if (reactive !== false) {
      this._dep.depend();
    }
    return this._stepsById[this._activeStepId];
  },

  setStep: function(id) {

    this._activeStepId = id;
    this._dep.changed();
    this.setCompletedSteps(id);
    return this._stepsById[this._activeStepId];
  },

  setCompletedSteps: function(id) {
    if (typeof id !== 'number') {
      var step = this._stepsById[id];
      id = step._index;
    }
    // add all previous steps as completed
    for(var i in this._stepsById){
      var currentStep = this._stepsById[i];
      if(currentStep._index < id){
        this.completeSteps.push(currentStep.id);
        currentStep.completed = true;
      }
    }
  },

  destroy: function() {
    if (this.clearOnDestroy) this.clearData();
  }
};
