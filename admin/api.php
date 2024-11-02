<?php
    include 'db.php';
    
    header('Content-Type: application/json');
    
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    if ($action === 'getBuses') {
        $result = $conn->query("SELECT * FROM buses");
        $buses = [];
        while ($row = $result->fetch_assoc()) {
            $buses[] = $row;
        }
        echo json_encode(['buses' => $buses]);
    } elseif ($action === 'getPickupSpots') {
        $busId = $_GET['busId'];
        $result = $conn->query("SELECT * FROM pickup_spots WHERE bus_id = $busId");
        $pickupSpots = [];
        while ($row = $result->fetch_assoc()) {
            $pickupSpots[] = $row;
        }
        echo json_encode(['pickupSpots' => $pickupSpots]);
    } elseif ($action === 'getBusLocation') {
        $busId = $_GET['busId'];
        // Simulate bus location
        $location = [
            'lat' => -34.397 + rand(-10, 10) / 100,
            'lng' => 150.644 + rand(-10, 10) / 100
        ];
        $estimatedArrivalTime = rand(5, 15) . ' minutes';
        echo json_encode(['location' => $location, 'estimatedArrivalTime' => $estimatedArrivalTime]);
    } elseif ($action === 'addBus') {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'];
        $route = $data['route'];
        $conn->query("INSERT INTO buses (name, route) VALUES ('$name', '$route')");
        echo json_encode(['success' => $conn->affected_rows > 0]);
    } elseif ($action === 'deleteBus') {
        $data = json_decode(file_get_contents('php://input'), true);
        $busId = $data['busId'];
        $conn->query("DELETE FROM buses WHERE bus_id = $busId");
        echo json_encode(['success' => $conn->affected_rows > 0]);
    }
?>
