Parser = function(context) {
  this.context = context;
  this.scriptArray = [];
  this.subtitlesArray = [];
  this.headersArray = [];
  this.fuzzySetArray = [];
  this.scriptExclusions = ['director'];
  this.subtitleExclusions = ['game of thrones', '<font', '=='];
  this.parsingComplete = false;
};

Parser.prototype.initialize = function() {
  this.context.on('RESET', $.proxy(this.reset, this));
};

Parser.prototype.reset = function() {
  this.scriptArray = [];
  this.subtitlesArray = [];
  this.headersArray = [];
  this.fuzzySetArray = [];
  this.parsingComplete = false;
};

Parser.prototype.parse = function(csv, srt) {
  this.parseScript(csv);
  this.parseSubtitles(srt);
};

// Parser.prototype.readFile = function(file, callback) {
//   var rawFile = new XMLHttpRequest();
//   rawFile.open("GET", file, false);
//   rawFile.onreadystatechange = function () {
//     if (rawFile.readyState === 4 && rawFile.status === 200) {
//       string = rawFile.responseText;
//       if (callback) callback(string);
//     }
//   };
//   rawFile.send(null);
// };

Parser.prototype.parseScript = function(string) {
  var stringArray = string.replace(/\r\n|\r|\n/g,'\n').split(/\n+/g);

  for (var i = 0; i < stringArray.length; i++) {
    var row = stringArray[i];
    var linesArray = row.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
    if (i === 0) {
      this.parseHeader(linesArray);
      continue;
    }

    var data = {};
    var exclude = false;

    for (var j = 0; j < this.headersArray.length; j++) {
      var key = this.headersArray[j];
      var value = linesArray[j];
      data[key] = linesArray[j];

      for (var k = 0; k < this.scriptExclusions.length; k++) {
        var exclusion = this.scriptExclusions[k];
        var item = value.toLowerCase();
        if (item.indexOf(exclusion) >= 0) {
          exclude = true;
        }
      }
    }

    if ('line' in data) {
      if (exclude) {
        this.fuzzySetArray.push('');
      } else {
        this.fuzzySetArray.push(data.line);
      }
    } else {
      alert('Cannot find "line" column');
      return;
    }

    this.scriptArray.push(data);
  }

  if (this.parsingComplete) {
    this.context.trigger('PARSING_COMPLETE', [this.scriptArray, this.subtitlesArray, this. fuzzySetArray]);
  } else {
    this.parsingComplete = true;
  }
};

Parser.prototype.parseHeader = function(headers) {
  for (var item = 0; item < headers.length; item++) {
    var header = headers[item].toLowerCase().replace('-', '_');
    this.headersArray.push(header);
  }
};

Parser.prototype.parseSubtitles = function(string) {
  var stringArray = string.replace(/\r\n|\r|\n/g,'\n').split(/\n\n+/g);

  outerLoop:
  for (var i = 0; i < stringArray.length; i++) {
    var subtitle = stringArray[i];
    var lineNumIndex = subtitle.indexOf((i+1).toString());
    if (lineNumIndex === 0) {
      for (var j = 0; j < this.subtitleExclusions.length; j++) {
        var exclusion = this.subtitleExclusions[j];
        var item = subtitle.toLowerCase();
        if (item.indexOf(exclusion) >= 0) {
          continue outerLoop;
        }
      }

      var indexArray = subtitle.split(/\n+/g);
      indexArray.splice(0,1);
      var timestamp = indexArray.shift();

      var multiplePeople = false;
      if (indexArray.length > 1) {
        for (var k = 0; k < indexArray.length; k++) {
          var arrayItem = indexArray[k];
          if (arrayItem.indexOf('- ') === 0) {
            this.addToSubtitlesArray(timestamp, arrayItem);
            multiplePeople = true;
          }
        }

        if (!multiplePeople) {
          var subtitleLine = indexArray.join(' ');
          this.addToSubtitlesArray(timestamp, subtitleLine);
        }
      } else {
        this.addToSubtitlesArray(timestamp, indexArray[0]);
      }
    }
  }

  if (this.parsingComplete) {
    this.context.trigger('PARSING_COMPLETE', [this.scriptArray, this.subtitlesArray, this.headersArray, this.fuzzySetArray,]);
  } else {
    this.parsingComplete = true;
  }
};

Parser.prototype.addToSubtitlesArray = function(timestamp, line) {
  this.subtitlesArray.push({
    timestamp: timestamp,
    line: line
  });
};