var generatingTextTimeout, almostThereTimeout;
var verdictBox; // Global variable for the verdict box
var viewResultsBtn; // Global variable for the 'View Results' button

document.getElementById('uploadForm').onsubmit = function(event) {
  event.preventDefault(); // Prevent the default form submission
  var formData = new FormData(this);
  var bufferingAnimation = document.getElementById('bufferingAnimation');
  var generatingText = document.getElementById('generatingText');
  var viewResultsBtn = document.querySelector('.view-results-btn');

  // Remove the 'View Results' button if it exists
  if (viewResultsBtn) {
    viewResultsBtn.remove();
    viewResultsBtn = null; // Reset the variable after removing the element
  }

  // Remove the verdict box if it exists
  if (verdictBox) {
    verdictBox.remove();
    verdictBox = null; // Reset the variable after removing the element
  }

  // Start the buffering animation and show the 'Generating report...' text
  bufferingAnimation.style.display = 'block';
  generatingText.textContent = 'Generating report...';
  generatingText.style.display = 'block';

  // Update the text after 30 seconds if the report is still generating
  clearTimeout(generatingTextTimeout);
  generatingTextTimeout = setTimeout(function() {
    generatingText.textContent = 'File is undergoing analysis in sandbox...';
  }, 30000); // 30000 milliseconds

  // Update the text after 60 seconds if the report is still generating
  clearTimeout(almostThereTimeout);
  almostThereTimeout = setTimeout(function() {
    generatingText.textContent = 'Almost there...';
  }, 60000); // 60000 milliseconds

  // Perform the AJAX request
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'upload.php', true);

  // Handle the response from the server
  xhr.onload = function() {
    clearTimeout(generatingTextTimeout); // Clear the timeouts to prevent text change
    clearTimeout(almostThereTimeout);
    if (xhr.status === 200) {
      // Stop the buffering animation and hide the 'Generating report...' text
      bufferingAnimation.style.display = 'none';
      generatingText.style.display = 'none';

      // Parse the results and determine the final verdict
      var results = JSON.parse(xhr.responseText);
      var finalVerdict = determineFinalVerdict(results);

      // Create and display the verdict box
      verdictBox = document.createElement('div');
      verdictBox.className = 'verdict-box ' + finalVerdict.class;
      verdictBox.innerHTML = '<span class="verdict-icon">' + finalVerdict.icon + '</span>' + finalVerdict.text;
      document.querySelector('.glass').insertBefore(verdictBox, viewResultsBtn);
      verdictBox.style.display = 'block';

      // Store the results in sessionStorage
      sessionStorage.setItem('results', xhr.responseText);

      // Create and display the 'View Results' button
      viewResultsBtn = document.createElement('button');
      viewResultsBtn.textContent = 'View Report';
      viewResultsBtn.className = 'view-results-btn';
      viewResultsBtn.onclick = function() {
        // Redirect to results.html
        window.location.href = 'results.html';
      };
      document.querySelector('.glass').appendChild(viewResultsBtn);
      viewResultsBtn.style.display = 'block';
    } else {
      alert('An error occurred!');
    }
  };

  // Send the form data
  xhr.send(formData);
};

// Function to determine the most severe verdict
function determineFinalVerdict(results) {
  var verdict = { class: '', text: '', icon: '' };
  var hasMalicious = false;
  var hasSuspicious = false;

  // Check the sandbox report for verdicts
  if (results.sandbox_report && results.sandbox_report.verdict) {
    hasMalicious = results.sandbox_report.verdict === 'malicious';
    hasSuspicious = results.sandbox_report.verdict === 'suspicious';
  }

  // Check the other reports for verdicts
  if (results.reports && results.reports.length > 0) {
    results.reports.forEach(function(report) {
      if (report.verdict === 'malicious') {
        hasMalicious = true;
      } else if (report.verdict === 'suspicious') {
        hasSuspicious = true;
      }
    });
  }

  if (hasMalicious) {
    verdict.class = 'malicious';
    verdict.text = 'Malicious';
    verdict.icon = '⚠'; // Warning sign icon
  } else if (hasSuspicious) {
    verdict.class = 'suspicious';
    verdict.text = 'Suspicious';
    verdict.icon = '⚠'; // Warning sign icon
  } else {
    verdict.class = 'safe';
    verdict.text = 'No specific threat';
    verdict.icon = '🔒'; // Shield icon
  }
  return verdict;
}
