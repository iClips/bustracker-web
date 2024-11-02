<?php
    session_start();
    
    // Dummy user credentials for demonstration
    $users = array(
      'user1' => 'password1',
      'user2' => 'password2'
    );
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $username = $_POST['username'];
        $password = $_POST['password'];
        
        if (isset($users[$username]) && $users[$username] === $password) {
            // Authentication successful
            $token = base64_encode(random_bytes(32)); // Generate a random token
            $_SESSION['authToken'] = $token;
            
            echo json_encode(array('success' => true, 'authToken' => $token));
            exit;
        } else {
            // Authentication failed
            echo json_encode(array('success' => false, 'message' => 'Invalid username or password'));
            exit;
        }
    } else {
        // Method not allowed
        http_response_code(405);
        echo json_encode(array('success' => false, 'message' => 'Method Not Allowed'));
        exit;
    }
?>
