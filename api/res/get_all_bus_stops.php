<?php
    include '../config.php';
    
    // session_start(); // Start the session to use session variables
    
    $busStops = [];
    $busStopQuery = "SELECT *
        FROM BusStop
        WHERE latitude != 0.000000 AND longitude != 0.000000;";
    $busStops = $conn->query($busStopQuery);
    
    echo json_encode($busStops);
    
    $conn->close();
?>
