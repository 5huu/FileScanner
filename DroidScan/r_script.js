document.addEventListener('DOMContentLoaded', function() {
    // Retrieve the results from sessionStorage
    var results = sessionStorage.getItem('results');
    var parsedResults;

    // Parse the JSON results
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

    // Function to create a tab button
    function createTabButton(reportId, reportTitle) {
        var button = document.createElement('button');
        button.className = 'tablinks';
        button.textContent = reportTitle;
        button.onclick = function() {
            openReport(reportId);
        };
        return button;
    }

    // Function to show a report
    function openReport(reportId) {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName('tabcontent');
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = 'none'; // Hide all tab content
        }
        tablinks = document.getElementsByClassName('tablinks');
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(' active', ''); // Remove 'active' class from all tabs
        }

        // Display the active tab content and set its title
        var activeContent = document.getElementById(reportId);
        if (activeContent) {
            activeContent.style.display = 'block';
            // Set the title for the active tab content
            var reportTitle = document.querySelector('.tablinks[data-report-id="' + reportId + '"]').textContent;
            var titleElement = activeContent.querySelector('.report-title');
            if (!titleElement) {
                titleElement = document.createElement('h2');
                titleElement.className = 'report-title';
                activeContent.insertBefore(titleElement, activeContent.firstChild);
            }
            titleElement.textContent = reportTitle;
        }

        var activeTab = document.querySelector('.tablinks[data-report-id="' + reportId + '"]');
        if (activeTab) {
            activeTab.className += ' active';
        }
    }

    // Create tab buttons dynamically based on the parsed results
    function createTabs(parsedResults) {
        var tabContainer = document.createElement('div');
        tabContainer.className = 'tab';

        // Create a button for each report and the overview
        if (parsedResults.overview) {
            var overviewButton = createTabButton('overview', 'Overview');
            overviewButton.setAttribute('data-report-id', 'overview'); // Set a custom attribute for identification
            tabContainer.appendChild(overviewButton);
        }

        if (parsedResults.reports && parsedResults.reports.length > 0) {
            parsedResults.reports.forEach(function(report) {
                var reportId = 'report-' + report.report_id;
                var reportButton = createTabButton(reportId, 'Sandbox Report: ' + report.report_id);
                reportButton.setAttribute('data-report-id', reportId); // Set a custom attribute for identification
                tabContainer.appendChild(reportButton);
            });
        }

        if (parsedResults.sandbox_report) {
            var sandboxButton = createTabButton('sandbox-report', 'Sandbox Report');
            sandboxButton.setAttribute('data-report-id', 'sandbox-report'); // Set a custom attribute for identification
            tabContainer.appendChild(sandboxButton);
        }

        // Append the tab container to the report-container element
        var reportContainer = document.querySelector('.tab-container');
        if (reportContainer) {
            reportContainer.insertBefore(tabContainer, reportContainer.firstChild);
        } else {
            console.error('The tab-container element was not found in the DOM.');
        }

        // Set the first tab as active
        if (tabContainer.firstChild) {
            tabContainer.firstChild.click();
        }
    }

    // Display the results in a structured format
    if (parsedResults) {
        createTabs(parsedResults); // Create tabs for the parsed results

        // Append 'overview', 'reports', and 'sandbox-report' content
        if (parsedResults.overview) {
            var overviewElement = document.createElement('div');
            overviewElement.className = 'tabcontent';
            overviewElement.id = 'overview';
            overviewElement.appendChild(createTableFromJson(parsedResults.overview));
            document.getElementById('results').appendChild(overviewElement);
        }

        if (parsedResults.reports && parsedResults.reports.length > 0) {
            parsedResults.reports.forEach(function(report) {
                var reportId = 'report-' + report.report_id;
                var reportElement = document.createElement('div');
                reportElement.className = 'tabcontent';
                reportElement.id = reportId;
                reportElement.appendChild(createTableFromJson(report));
                document.getElementById('results').appendChild(reportElement);
            });
        }

        if (parsedResults.sandbox_report) {
            var sandboxReportElement = document.createElement('div');
            sandboxReportElement.className = 'tabcontent';
            sandboxReportElement.id = 'sandbox-report';
            sandboxReportElement.appendChild(createTableFromJson(parsedResults.sandbox_report));
            document.getElementById('results').appendChild(sandboxReportElement);
        }
    } else {
        document.getElementById('results').textContent = 'No results available.';
    }

    // Function to add the main title to the PDF
    function addMainTitleToPDF(doc, title) {
        doc.setFontSize(20); // Set the title font size
        doc.text(title, 110, 20);
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
    downloadBtn.className = 'download-btn';
    downloadBtn.addEventListener('click', function() {
        const { jsPDF } = window.jspdf;
        var doc = new jsPDF('landscape');

        // Set the global styles for the tables
        doc.autoTableSetDefaults({
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
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

    // Append the styled download button to a container within the '.report-container'
    var reportContainer = document.querySelector('.report-container'); // Select the report container
    var analysisTable = document.querySelector('.analysis-table');
    var buttonContainer = reportContainer.insertBefore(document.createElement('div'), reportContainer.firstChild); // Create a new div at the top of the report container
    buttonContainer.appendChild(downloadBtn); // Append the download button to the new div

    // Call openReport for 'overview' after tabs and content are created
    if (parsedResults && parsedResults.overview) {
        openReport('overview');
    }
});