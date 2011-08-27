/**
 * @param {Array} scripts an array of script infos to validate
 * @returns {Array} of arrays containing errors for each script
 */
function validate(scripts) {
  var validation = [];
  scripts.forEach(function(script) {
    validation.push(validateScript(script));
  });

  return validation;
}

function validateScript(scriptInfo) {
  var errors = [];
  var isValid = JSHINT(scriptInfo.contents);
  if (!isValid) {
    JSHINT.errors.forEach(function(error) {
      if (error === null) {
        // Why does JSHINT return a null terminated array?
        return;
      }
      error.url = scriptInfo.src;
      errors.push(error);
    });
  }

  return errors;
}

/**
 * @return {Array} of objects containing script names and their contents
 */
function getContent(scripts) {
  var output = [];
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i];
    var scriptInfo = {};
    scriptInfo.src = src;
    scriptInfo.contents = fetchScript(src);
    output.push(scriptInfo);
  }
  return output;
}

/**
 * Do a synchronous XHR for the script contents
 *
 * @param {String} url URL of the script to retrieve
 * @return {String} contents of the script
 */
function fetchScript(url) {
  var response = null;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, false);
  xhr.onreadystatechange = function() {
    if (xhr.status == 200) {
      response = xhr.responseText;
    }
  };
  xhr.send();
  return response;
}

chrome.extension.onRequest.addListener(function(scripts, _, callback) {
  callback({ files: validate(getContent(scripts)) });
});
