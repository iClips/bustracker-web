<?php
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    
    session_start();
    
    $servername = "localhost:3306";
    $username = "icliphaw_icliphaw";
    $password = "Lightnsound1";
    
    try {
        $conn = new PDO("mysql:host=$servername;dbname=icliphaw_bus_tracker", $username, $password, array(
            PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
        ));
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (PDOException $e) {
        die("Connection failed: " . $e->getMessage());
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        echo json_encode(array('success' => false, 'message' => 'Invalid username or password'));
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = getQueryParam('action', 'Unknown');
    
        if (!isset($_SESSION['authToken'])) {
            unauthorizedResponse("Unauthorized access. No auth token provided in session.");
        }
    
        if (!validateAuthToken($_SESSION['authToken'])) {
            unauthorizedResponse("Unauthorized access. Invalid auth token.");
        }
    
        switch ($action) {
            case 'bus_stops':
                getBusStops($conn);
                break;
            case 'available_buses':
                $pickupID = getQueryParam('pickupID', null);
                $dropOffID = getQueryParam('dropOffID', null);
                
                if (!isset($pickupID) || !isset($dropOffID)) {
                    echo json_encode(['error' => 'Invalid input']);
                    exit;
                }
                
                getAvailableBuses($conn, $pickupID, $dropOffID);
                break;
            case 'validate_token':
                validateToken();
                break;
            default:
                http_response_code(404);
                echo json_encode(array('error' => 'No parameter found.'));
        }
    } else {
        // Method not allowed
        http_response_code(405);
        echo json_encode(array('success' => false, 'message' => 'Method Not Allowed'));
    }
    
    // Function to get bus stops
    function getBusStops($conn) {
        try {
            $sql = "SELECT * FROM BusStop WHERE latitude != 0.000000 AND longitude != 0.000000;";
            $sth = $conn->prepare($sql);
            $sth->execute();
            $data = $sth->fetchAll(PDO::FETCH_ASSOC);
    
            foreach ($data as &$stop) {
                $stop['latitude'] = (float) $stop['latitude'];
                $stop['longitude'] = (float) $stop['longitude'];
                $stop['heading'] = (float) $stop['heading'];
                $stop['ID'] = (float) $stop['ID'];
            }
    
            http_response_code(200);
            echo json_encode(array('success' => true, 'data' => $data));
        } catch (PDOException $ex) {
            http_response_code(502);
            echo json_encode(["error" => "There was a database error. Kindly, try again later."]);
        }
    }
    
    function getAvailableBuses($conn, $pickup, $dropOff) {
        try {
            $sql = "SELECT DISTINCT b.*
                FROM Bus b
                JOIN BusPickupSpot bp1 ON b.ID = bp1.BusID
                JOIN BusPickupSpot bp2 ON b.ID = bp2.BusID
                JOIN BusStop bs1 ON bp1.BusStopID = bs1.ID
                JOIN BusStop bs2 ON bp2.BusStopID = bs2.ID
                WHERE bs1.ID = :pickupID AND bs2.ID = :dropOffID;";
            $sth = $conn->prepare($sql);
            $sth->execute(['pickupID' => $pickup, 'dropOffID' => $dropOff]);
            $data = $sth->fetchAll(PDO::FETCH_ASSOC);
    
            http_response_code(200);
            
            // Validate and process the data
            foreach ($data as &$bus) {
                if (isset($bus['route'])) {
                    if (validateRoute($bus['route'])) {
                        echo json_encode(array('success' => true, 'data' => $data));
                    } else {
                        // Handle invalid route format
                        echo json_encode(array('error' => 'The route data is invalid'));
                    }
                }
            }
            
        } catch (PDOException $ex) {
            http_response_code(502);
            echo json_encode(["error" => "There was a database error. Kindly, try again later."]);
        }
    }
    
    // Function to validate the token
    function validateToken() {
        http_response_code(200);
        echo json_encode(array('success' => true, 'message' => 'Token is valid'));
    }
    
    // Function to validate auth token
    function validateAuthToken($sessionToken) {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            $token = explode(' ', $authHeader)[1] ?? null; // Extract token part
    
            return $token && $token === $sessionToken;
        }
    
        return false; // No Authorization header found
    }
    
    // Function to get query parameter
    function getQueryParam($param, $default = null) {
        return isset($_GET[$param]) ? htmlspecialchars($_GET[$param]) : $default;
    }
    
    // Function to respond with unauthorized error
    function unauthorizedResponse($message) {
        http_response_code(401);
        echo json_encode(["error" => $message]);
        exit;
    }

    function validateRoute($route) {
        // Check if the route is a valid JSON string
        $routeArray = json_decode($route, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return false;
        }
    
        // Check if each element in the route array has 'lat' and 'lng' properties
        foreach ($routeArray as $point) {
            if (!isset($point['lat']) || !isset($point['lng'])) {
                return false;
            }
        }
    
        return true;
    }


?>
