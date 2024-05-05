<?php
set_time_limit(500);
header('Content-Type: application/json');

// Hybrid Analysis API endpoints
$submit_file_url = 'https://www.hybrid-analysis.com/api/v2/submit/file';
$overview_url = 'https://www.hybrid-analysis.com/api/v2/overview';
$report_summary_url = 'https://www.hybrid-analysis.com/api/v2/report';

// API Key - Replace with your actual API key and store it securely
$api_key = 'rfl5twp0db29ded9m1vgw9456df6803ak4do6tzx532a55380qjn69ko9d2c38e4';

// File to upload
$file = $_FILES['file']['tmp_name'];
$filename = basename($_FILES['file']['name']);

// Environment ID
$environment_id = '200';

// Generate SHA256 hash of the file
$sha256 = hash_file('sha256', $file);

// Function to check for verdict in reports
function checkForVerdict($report_ids, $api_key, $report_summary_url) {
    $verdicts = [];
    foreach ($report_ids as $report_id) {
        $report_url = $report_summary_url . '/' . $report_id . '/summary';
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $report_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'accept: application/json',
            'api-key: ' . $api_key,
            'User-Agent: Falcon'
        ));

        $response = curl_exec($ch);
        if ($response === false) {
            curl_close($ch);
            continue; // Skip if there's an error fetching the report
        }

        $report_data = json_decode($response, true);
        curl_close($ch);

        if (isset($report_data['verdict'])) {
            $verdicts[] = $report_data;
        }
    }
    return $verdicts;
}

// Function to display the report
function displayReport($url, $api_key) {
    do {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'accept: application/json',
            'api-key: ' . $api_key,
            'User-Agent: Falcon'
        ));

        $response = curl_exec($ch);
        if ($response === false) {
            curl_close($ch);
            return array('error' => 'Error fetching report: ' . curl_error($ch));
        }

        $data = json_decode($response, true);
        $state = $data['state'] ?? null;
        curl_close($ch);

        if ($state !== 'IN_PROGRESS') {
            return $data;
        }

        // Wait for 10 seconds before checking the status again
        sleep(10);

    } while ($state === 'IN_PROGRESS');
}

// Get overview using SHA256 hash
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $overview_url . '/' . $sha256);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'accept: application/json',
    'api-key: ' . $api_key,
    'User-Agent: Falcon'
));

$overview_response = curl_exec($ch);
if ($overview_response === false) {
    echo json_encode(array('error' => 'Error fetching overview: ' . curl_error($ch)));
    curl_close($ch);
    exit;
}

$decoded_overview_response = json_decode($overview_response, true);
curl_close($ch);

// Initialize results array
$results = array();

// Add overview to results
$results['overview'] = $decoded_overview_response;

// Check for verdict in reports
$report_ids = $decoded_overview_response['reports'] ?? [];

// Initialize the variable to track if any verdicts are found
$verdict_found = false;

// Fetch and add the reports to the results
foreach ($report_ids as $report_id) {
    $report_data = displayReport($report_summary_url . '/' . $report_id . '/summary', $api_key);
    if (!isset($report_data['error'])) {
        // Add report_id to the report data
        $report_data['report_id'] = $report_id;
        $results['reports'][] = $report_data;
        // Check if the report has a verdict
        if (isset($report_data['verdict'])) {
            $verdict_found = true;
        }
    }
}

// Submit to sandbox only if no verdict is found
if (!$verdict_found) {
    // Prepare POST data for file submission
    $post_data = array(
        'file' => new CURLFile($file, 'application/vnd.android.package-archive', $filename),
        'environment_id' => $environment_id
    );

    // Initialize cURL session
    $ch = curl_init();

    // Submit file to sandbox
    curl_setopt($ch, CURLOPT_URL, $submit_file_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'accept: application/json',
        'api-key: ' . $api_key,
        'Content-Type: multipart/form-data',
        'User-Agent: Falcon'
    ));

    // Execute cURL request for file submission
    $sandbox_response = curl_exec($ch);
    if ($sandbox_response === false) {
        echo json_encode(array('error' => 'Error: ' . curl_error($ch)));
        curl_close($ch);
        exit;
    }

    $decoded_sandbox_response = json_decode($sandbox_response, true);
    curl_close($ch);

    // Extract job_id from the sandbox response
    $job_id = $decoded_sandbox_response['job_id'] ?? null;

    // Display the sandbox report using the job ID
    if ($job_id) {
        $sandbox_report_url = $report_summary_url . '/' . $job_id . '/summary';
        $sandbox_report_data = displayReport($sandbox_report_url, $api_key);
        if (isset($sandbox_report_data['error'])) {
            $results['error'] = $sandbox_report_data['error'];
        } else {
            $results['sandbox_report'] = $sandbox_report_data;
        }
    }
} else {
    // If a verdict exists, add a message to the results indicating no need for sandbox submission
    $results['message'] = 'A verdict exists in the reports. No sandbox submission required.';
}

// Encode results array to JSON and echo
echo json_encode($results);
?>