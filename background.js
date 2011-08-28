/**
 * @param {Array} scripts an array of script infos to validate
 * @returns {Array} of arrays containing errors for each script
 */
function validate(scripts) {
  var validation = [];
  scripts.forEach(function (script) {
    validation.push(validateScript(script));
  });
  return validation;
}

function validateScript(scriptInfo) {
  var errors = [];
  var isValid = JSHINT(scriptInfo.content);

  if (!isValid) {
    JSHINT.errors.forEach(function (error) {
      if (error === null) {
        // Why does JSHINT return a null terminated array?
        return;
      }
      error.url = scriptInfo.url;
      errors.push(error);
    });
  }

  return errors;
}

chrome.extension.onRequest.addListener(function (scripts, _, callback) {
  callback({ files: validate(scripts) });
});
