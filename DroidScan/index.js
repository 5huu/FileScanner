<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>App Scanner</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="glass">
    <form class="upload-form" id="uploadForm" action="upload.php" method="post" enctype="multipart/form-data">
      <h1>App Scanner</h1>
      <input type="file" name="file" class="upload-input" accept=".apk" required>
      <button type="submit" class="submit-btn">Submit</button>
      <!-- Buffering animation -->
      <div class="buffering" id="bufferingAnimation"></div>
      <!-- Text below the buffer -->
      <p class="generating-text" id="generatingText">Generating report...</p>
    </form>
    <!-- Button to view results will be inserted here -->
  </div>

  <script src="script.js"></script>    
</body>
</html>
