document.addEventListener('DOMContentLoaded', function() {
    // Retrieve the results from sessionStorage
    var results = sessionStorage.getItem('results');

    // Parse the JSON results
    var parsedResults;
    try {
        parsedResults = JSON.parse(results);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        parsedResults = null;
    }

    // Function to create a title element
    function createTitleElement(titleText) {
        var titleElement = document.createElement('h2');
        titleElement.textContent = titleText;
        return titleElement;
    }

    // Function to check if an object has only empty arrays or null values
    function isEmptyObject(obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] !== null && obj[key].length !== 0) {
                return false;
            }
        }
        return true;
    }

    // Function to create a table from a JSON object
    function createTableFromJson(jsonObject) {
        var table = document.createElement('table');
        var tableBody = document.createElement('tbody');

        for (var key in jsonObject) {
            if (jsonObject.hasOwnProperty(key) && jsonObject[key] !== null && jsonObject[key] !== "" && !(Array.isArray(jsonObject[key]) && jsonObject[key].length === 0)) {
                // Skip keys with empty objects
                if (typeof jsonObject[key] === 'object' && isEmptyObject(jsonObject[key])) {
                    continue;
                }

                var row = document.createElement('tr');
                var cellKey = document.createElement('td');
                cellKey.appendChild(document.createTextNode(key));
                var cellValue = document.createElement('td');

                // Check if the value is an array or an object
                if (Array.isArray(jsonObject[key])) {
                    var subTable = document.createElement('table');
                    jsonObject[key].forEach(function(item) {
                        var subTableRow = document.createElement('tr');
                        var subTableCell = document.createElement('td');
                        if (typeof item === 'object' && item !== null) {
                            subTableCell.appendChild(createTableFromJson(item)); // Recursive call for nested objects
                        } else if (item) { // Exclude falsey values except for 0
                            subTableCell.textContent = item;
                        }
                        subTableRow.appendChild(subTableCell);
                        subTable.appendChild(subTableRow);
                    });
                    cellValue.appendChild(subTable);
                } else if (typeof jsonObject[key] === 'object') {
                    var subTable = createTableFromJson(jsonObject[key]); // Recursive call for nested objects
                    cellValue.appendChild(subTable);
                } else {
                    // For non-array and non-object values, just set the text content
                    cellValue.textContent = jsonObject[key];
                }

                row.appendChild(cellKey);
                row.appendChild(cellValue);
                tableBody.appendChild(row);
            }
        }

        table.appendChild(tableBody);
        return table;
    }

    // Display the results in a structured format
    if (parsedResults) {
        // Display Overview
        if (parsedResults.overview) {
            var overviewTitle = createTitleElement('Overview');
            document.getElementById('results').appendChild(overviewTitle);
            var overviewElement = document.createElement('div');
            overviewElement.appendChild(createTableFromJson(parsedResults.overview));
            overviewElement.id = 'overview'; // Assign an ID for the overview section
            document.getElementById('results').appendChild(overviewElement);
        }

        // Display Reports
        if (parsedResults.reports && parsedResults.reports.length > 0) {
            parsedResults.reports.forEach(function(report, index) {
                var reportTitle = createTitleElement('Existing Behavioral Analysis Report ' + ': ' + report.report_id);
                document.getElementById('results').appendChild(reportTitle);
                var reportElement = document.createElement('div');
                reportElement.appendChild(createTableFromJson(report));
                reportElement.id = 'report-' + report.report_id; // Assign an ID for each report
                document.getElementById('results').appendChild(reportElement);
            });
        }

        // Display Sandbox Report
        if (parsedResults.sandbox_report) {
            var sandboxReportTitle = createTitleElement('Sandbox Behavioral Analysis Report');
            document.getElementById('results').appendChild(sandboxReportTitle);
            var sandboxReportElement = document.createElement('div');
            sandboxReportElement.appendChild(createTableFromJson(parsedResults.sandbox_report));
            sandboxReportElement.id = 'sandbox-report'; // Assign an ID for the sandbox report
            document.getElementById('results').appendChild(sandboxReportElement);
        }
    } else {
        // Display an error message if no results are available or if there was an error parsing the JSON
        document.getElementById('results').textContent = 'No results available.';
    }

    // Function to add the main title to the PDF
    function addMainTitleToPDF(doc, title) {
        doc.setFontSize(20); // Set the title font size
        doc.text(title, 100, 20);
    }

    // Function to add sections to the PDF
    function addSectionToPDF(doc, sectionId, title, startY) {
        var sectionElement = document.getElementById(sectionId);
        if (sectionElement) {
            var yPosition = startY || doc.lastAutoTable.finalY + 10 || 20; // Use startY if provided
            doc.text(title, 14, yPosition);
            doc.autoTable({
                html: '#' + sectionId + ' table',
                startY: yPosition + 5,
                theme: 'grid',
                columnStyles: {
                    0: {cellWidth: 43},
                },
                didParseCell: function(data) {
                    if (data.cell.raw.tagName === "TH") {
                        data.cell.styles.halign = 'center';
                    }
                }
            });
        }
    }

    // Add a button to trigger the PDF download
    var downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Download as PDF';
    downloadBtn.addEventListener('click', function() {
        const { jsPDF } = window.jspdf;
        var doc = new jsPDF('landscape');

        // Set the global styles for the tables
        doc.autoTableSetDefaults({
            headStyles: {
                fillColor: [255, 255, 255], // Lighter header background
                textColor: [0, 0, 0], // Ensure text color is set to black (or any visible color)
                halign: 'center',
            },
            bodyStyles: {
                cellPadding: 3,
            },
        });

        // Add the main title to the PDF
        addMainTitleToPDF(doc, 'Malware Analysis Report');

        // Adjust the startY parameter for the first section to ensure it doesn't overlap with the title
        var firstSectionStartY = 30; // Adjust this value as needed

        // Add the Overview section to the PDF
        addSectionToPDF(doc, 'overview', 'Overview', firstSectionStartY);

        // Calculate the starting Y position for the next section
        var nextSectionStartY = doc.lastAutoTable.finalY + 10;

        // Add each report to the PDF
        if (parsedResults.reports && parsedResults.reports.length > 0) {
            parsedResults.reports.forEach(function(report) {
                addSectionToPDF(doc, 'report-' + report.report_id, 'Existing Behavioral Analysis Report: ' + report.report_id, nextSectionStartY);
                // Update nextSectionStartY for the next report
                nextSectionStartY = doc.lastAutoTable.finalY + 10;
            });
        }

        // Add the Sandbox Report section to the PDF
        addSectionToPDF(doc, 'sandbox-report', 'Sandbox Behavioral Analysis Report', nextSectionStartY);

        // Save the PDF
        doc.save('malware-analysis-report.pdf');
    });

    // Append the download button to the body or another element of your choice
    downloadBtn.style.background = 'linear-gradient(145deg, #7338a0, #924dbf)';
    downloadBtn.style.color = '#fff';
    downloadBtn.style.border = 'none';
    downloadBtn.style.padding = '10px 20px';
    downloadBtn.style.marginTop = '20px';
    downloadBtn.style.borderRadius = '5px';
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.style.transition = 'background 0.3s ease-in-out';
    // Append the styled download button to the 'results' element
    document.getElementById('results').appendChild(downloadBtn);
});
