ScriptMatcher = function(context) {
  this.context = context;
  this.formWrap = $('.form-wrap', this.context);
  this.form = $('#form', this.formWrap);
  this.checkbox = $('#spreadsheet-checkbox', this.context);
  this.textFields = $('.text-fields-wrap', this.context);
  this.scriptField = $('#script', this.context);
  this.subtitlesField = $('#subtitles', this.context);
  this.urlField = $('#spreadsheet-url', this.context);
  this.nameField = $('#spreadsheet-name', this.context);
  this.resultsWrap = $('.results-wrap', this.context);
  this.loader = $('.loader', this.context);
  this.resetButton = $('#reset', this.context);
  this.srt = null;
  this.csv = null;
  this.parser = null;
  this.textMatcher = null;
  this.usedNames = [];
};

ScriptMatcher.prototype.initialize = function() {
  this.parser = new Parser(this.context);
  this.parser.initialize();

  this.textMatcher = new TextMatcher(this.context);
  this.textMatcher.initialize();

  this.checkbox.change($.proxy(this.checkboxHandler, this));
  this.form.submit($.proxy(this.onSubmit, this));
  this.resetButton.on('click', $.proxy(this.reset, this));
  this.context.on('SHOW_RESULTS', $.proxy(this.showResults, this));
};

ScriptMatcher.prototype.reset = function() {
  this.context.trigger('RESET');
  this.srt = null;
  this.csv = null;
  $('#results', this.context).html('');
  this.resultsWrap.hide();
  this.formWrap.show();
  this.scriptField.val('');
  this.subtitlesField.val('');
};

ScriptMatcher.prototype.checkboxHandler = function() {
  if (this.checkbox.prop('checked')) {
    this.textMatcher.checkboxValue = true;
    this.textFields.show();
  } else {
    this.textMatcher.checkboxValue = false;
    this.textFields.hide();
  }
};

ScriptMatcher.prototype.onSubmit = function(e) {
  e.preventDefault();
  var nameValid = this.nameValidator();
  if (this.textMatcher.checkboxValue && this.urlField.val() === '') {
    alert('Enter Google Script url');
  } else if (this.textMatcher.checkboxValue && !nameValid) {
    alert('Use a new name');
  } else if (window.FileReader) {
    this.formWrap.hide();
    this.loader.show();

    if (this.textMatcher.checkboxValue) {
      this.textMatcher.url = this.urlField.val();
      var name = this.nameField.val();
      this.textMatcher.spreadsheetName = name;

      if (name.length > 0) {
        this.usedNames.push(name);
      }
    }

    var csv = this.scriptField[0].files[0];
    var srt = this.subtitlesField[0].files[0];
    this.getAsText(csv, $.proxy(this.setCsv, this));
    this.getAsText(srt, $.proxy(this.setSrt, this));
  } else {
    alert('FileReader not supported in this browser.');
  }
};

ScriptMatcher.prototype.nameValidator = function() {
  var isValid = true;
  var newName = this.nameField.val();
  for (var i = 0; i < this.usedNames.length; i++) {
    var name = this.usedNames[i];
    if (newName === name) {
      isValid = false;
      break;
    }
  }
  return isValid;
};

ScriptMatcher.prototype.setCsv = function(result) {
  this.csv = result;
  if (this.srt) {
    this.parser.parse(this.csv, this.srt);
  }
};

ScriptMatcher.prototype.setSrt = function(result) {
  this.srt = result;
  if (this.csv) {
    this.parser.parse(this.csv, this.srt);
  }
};

ScriptMatcher.prototype.getAsText = function(file, callback) {
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function(event) {
    if (callback) callback(event.target.result);
  };
  reader.onerror = function() {
    console.log('error');
  };
};

ScriptMatcher.prototype.showResults = function() {
  this.loader.hide();
  this.resultsWrap.show();
};

var scriptMatcher = new ScriptMatcher($('#main'));
scriptMatcher.initialize();