var scripts = [],
  urls = {},
  scriptsCount = 0,
  onScriptsLoad;

chrome.experimental.devtools.resources.onFinished.addListener(function (resource) {
  var url = resource.request.url;

  if (urls[url]) {
    return null;
  }

  if (resource.response.content.mimeType.toLowerCase().indexOf('javascript') >= 0) {
    // chrome.experimental.devtools.log(url);

    urls[url] = true;

    scriptsCount++;

    resource.getContent(function (content) {
      scripts.push({ content: content, url: url });

      if (onScriptsLoad && scriptsCount === scripts.length) {
        onScriptsLoad();
      }
    });
  }
});

var category = chrome.experimental.devtools.audits.addCategory(
    "Javascript Validation", 100);

category.onAuditStarted.addListener(function (auditResults) {
  if (scriptsCount && scriptsCount === scripts.length) {
    validate(auditResults);
  } else {
    onScriptsLoad = function () {
      validate(auditResults);
    };
  }
});

function validate(auditResults) {
  chrome.extension.sendRequest(scripts, function (response) {
    if (response.error) {
      // Something bad happened.
      auditResults.addResult('Unknown error',
          'An unknown error occurred in the Javascript Validator extension',
          auditResults.Severity.Severe);
      auditResults.done();
      return;
    }
    var isError = false;
    // Iterate through files and their errors and show them with the 
    // web inspector
    var files = response.files;
    for (var i = 0; i < files.length; i++) {
      var errors = files[i];
      var errorResult = auditResults.createResult();
      errorResult.expanded = true;
      for (var j = 0; j < errors.length; j++) {
        var error = errors[j];
        isError = true;
        // Use custom audit formatter if available
        if (auditResults.createResourceLink) {
          errorResult.addChild(auditResults.createResourceLink(error.url, error.line));
        }
        errorResult.addChild(formatError(error));
      }
      if (errors.length) {
        auditResults.addResult(error.url + ' (' + errors.length + ' errors)',
            '', auditResults.Severity.Severe, errorResult);
      }
    }
    if (!isError) {
      // Show that there are no errors!
      auditResults.addResult("No issues",
          "There are no issues with the Javascript on this page",
          auditResults.Severity.Info);
    }
    auditResults.done();
  });
}

var ERROR_FORMAT = 'Line {{LINE}}: {{REASON}} - {{EVIDENCE}}';
var MAX_EVIDENCE = 80;
function formatError(error) {
  // Get the fragment of evidence near the actual character position
  var start = error.character - MAX_EVIDENCE/2;
  var end = error.character + MAX_EVIDENCE/2;
  var evidence = error.evidence && error.evidence.substring(start, end) || '';
  return ERROR_FORMAT
      .replace('{{LINE}}', error.line)
      .replace('{{REASON}}', error.reason)
      .replace('{{EVIDENCE}}', evidence)
      .replace('{{}}', error.a)
}
