document.getElementById('login_form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    document.getElementById('errorText').textContent = '';
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    
    // AJAX request to PHP server for authentication
    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'api/auth.php', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let response = JSON.parse(xhr.responseText);
            if (response.success) {
                sessionStorage.setItem("authToken", response.authToken);
                window.location.href = 'app';
            } else {
                document.getElementById('errorText').textContent = response.message;
            }
        }
    };
    xhr.send('username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password));
});