TextMatcher = function(context) {
  this.context = context;
  this.resultsWrap = $('.results-wrap', this.context);
  this.resultsTable = $('#results', this.context);
  this.headersArray = [];
  this.scriptArray = [];
  this.subtitlesArray = [];
  this.fuzzySetArray = [];
  this.url = '';
  this.spreadsheetName = '';
  this.currentIndex = 0;
  this.totalMatches = 0;
  this.checkboxValue = false;
  this.minPercentage = 0.5;
};

TextMatcher.prototype.initialize = function() {
  this.context.on('RESET', $.proxy(this.reset, this));
  this.context.on('PARSING_COMPLETE', $.proxy(this.matchText, this));
};

TextMatcher.prototype.reset = function() {
  this.scriptArray = [];
  this.subtitlesArray = [];
  this.headersArray = [];
  this.fuzzySetArray = [];
  this.url = '';
  this.spreadsheetName = '';
  this.currentIndex = 0;
  this.totalMatches = 0;
};

TextMatcher.prototype.matchText = function(e, script, subtitles, headers, fuzzyset) {
  this.scriptArray = script;
  this.subtitlesArray = subtitles;
  this.headersArray = headers;
  this.fuzzySetArray = fuzzyset;

  var fuzzySet = FuzzySet(this.fuzzySetArray);

  for (var i in this.subtitlesArray) {
    var subtitle = this.subtitlesArray[i];
    var subtitleLine = subtitle.line;
    var result = fuzzySet.get(subtitleLine);

    if (result) {
      for (var j = 0; j < result.length; j++) {
        var item = result[j];
        if (!item) continue;

        var matchPercentage = item[0];
        var scriptLine = item[1];
        var resultIndex = this.fuzzySetArray.indexOf(scriptLine);
        var indicesAreNear = (resultIndex >= 0) ? Math.abs(resultIndex - this.currentIndex) <= 20 : false;

        if (matchPercentage >= this.minPercentage && resultIndex > 0 && indicesAreNear) {
          this.currentIndex = resultIndex;
          var scriptResult = this.scriptArray[resultIndex];

          scriptResult.timestamp = subtitle.timestamp;
          scriptResult.subtitle = subtitleLine;
          scriptResult.match_percentage = matchPercentage;

          this.fuzzySetArray[resultIndex] = '';
          this.totalMatches++;
        }
      }
    }
  }
  this.appendToDom();
};

TextMatcher.prototype.appendToDom = function() {
  this.context.trigger('SHOW_RESULTS');
  $('.total span', this.resultsWrap).html(this.totalMatches);

  this.headersArray.push('timestamp', 'subtitle', 'match_percentage');
  this.addRow(this.headersArray);

  for (var i in this.scriptArray) {
    var script = this.scriptArray[i];
    var row = $('<tr></tr>');

    var dataArray = [];
    for (var j = 0; j < this.headersArray.length; j++) {
      var key = this.headersArray[j];
      var value = script[key];
      if (typeof value === 'string') {
        value = value.replace(/['"]+/g, '');
      }
      dataArray.push(value);
    }
    this.addRow(dataArray);
  }
  if (this.checkboxValue) this.exportToSpreadsheet();
};

TextMatcher.prototype.addRow = function(dataArray) {
  var row = $('<tr></tr>');
  for (var i = 0; i < dataArray.length; i++) {
    var data = dataArray[i];
    if (data) {
      data = data.toString().replace('_', '-');
    }
    var el = $('<td></td>').html(data);
    row.append(el);
  }
  this.resultsTable.append(row);
};

TextMatcher.prototype.exportToSpreadsheet = function() {
  var spreadsheetScript = 'https://script.google.com/macros/s/AKfycbxalv1DzUZuqOlRSDZFZOHyv5UBM5jW7hLQgYlcGO0KGL0fi0VE/exec';
  if (this.spreadsheetName.length === '') {
    this.spreadsheetName = 'ScriptMatcher';
  }
  $.ajax({
    type: 'POST',
    url: spreadsheetScript,
    data: JSON.stringify({'sheetName': this.spreadsheetName, 'headers': this.headersArray, 'scripts': this.scriptArray}),
    dataType: 'json',
    success: function(response) {
      console.log('success', response);
    },
    error: function(error) {
      console.log('error', error);
    }
  });
};