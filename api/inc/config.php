<?php
    $servername = "localhost:3306";
    $username = "icliphaw_icliphaw";
    $password = "Lightnsound1";
    
    try {
        $conn = new PDO("mysql:host=$servername;dbname=icliphaw_bus_tracker", $username, $password,array(
                PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
            ));
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      
    } catch(PDOException $e) {
        die("Connection failed: " . $e->getMessage());
    }
?>