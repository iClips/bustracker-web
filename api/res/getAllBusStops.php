<?php
    include 'config.php';
    
    // session_start(); // Start the session to use session variables
    
    
    // Check if auth token is set in the session
    if (!isset($_SESSION['auth_token'])) {
        http_response_code(401); // Unauthorized
        echo json_encode(["error" => "Unauthorized access. No auth token provided."]);
        exit;
    }
    
    // Validate auth token (you can add more validation logic as needed)
    $authToken = $_SESSION['auth_token'];
    if ($authToken !== 'your_expected_token_value') {
        http_response_code(401); // Unauthorized
        echo json_encode(["error" => "Unauthorized access. Invalid auth token."]);
        exit;
    }
    
    // Fetch Bus Stops
    $busStops = [];
    $busStopQuery = "SELECT * FROM BusStop";
    $busStopResult = $conn->query($busStopQuery);
    if ($busStopResult->num_rows > 0) {
        while ($row = $busStopResult->fetch_assoc()) {
            $busStops[] = $row;
        }
    }
    
    // Fetch Buses
    $buses = [];
    $busQuery = "SELECT * FROM Bus";
    $busResult = $conn->query($busQuery);
    if ($busResult->num_rows > 0) {
        while ($row = $busResult->fetch_assoc()) {
            $buses[] = $row;
        }
    }
    
    // Return the data as JSON
    header('Content-Type: application/json');
    echo json_encode([
        "busStops" => $busStops,
        "buses" => $buses
    ]);
    
    $conn->close();
?>
