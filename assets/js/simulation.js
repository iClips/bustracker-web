let moveInterval;
let previousPosition = null;
let direction = 'east';
const busIconDirection = {
        north: 'assets/images/home/markers/orange-bus/northO.png',
        northEast: 'assets/images/home/markers/orange-bus/northeastO.png',
        east: 'assets/images/home/markers/orange-bus/eastO.png',
        southEast: 'assets/images/home/markers/orange-bus/southeastO.png',
        south: 'assets/images/home/markers/orange-bus/southO.png',
        southWest: 'assets/images/home/markers/orange-bus/southwestO.png',
        west: 'assets/images/home/markers/orange-bus/westO.png',
        northWest: 'assets/images/home/markers/orange-bus/northwestO.png',
    };


function simulateBusMovement(busMarker, routeData, updateInterval, metersPerUpdate, busStops, pickup, dropOff) {
    let currentIndex = 0;
    let currentDistance = 0;
    let isStopped = false;
    const stopTime = 5000;
    let stopTimeout;
    let hasReachedPickup = false;
    
    function isBusAtStop(currentLocation) {
        return busStops.some(stop => 
            haversineDistance(currentLocation.lat, currentLocation.lng, stop.latitude, stop.longitude) < 2
        );
    }

    function calculateETA(currentLocation, location) {
        const distanceToLocation = haversineDistance(currentLocation.lat, currentLocation.lng, location.lat, location.lng);
        const timeToReach = distanceToLocation / metersPerUpdate * updateInterval;
        
        const { hours, minutes, seconds } = convertMilliseconds(timeToReach);
    
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    function hasReachedMyLocation(currentLocation, targetLocation) {
        const distance = haversineDistance(currentLocation.lat, currentLocation.lng, targetLocation.lat, targetLocation.lng);
        // console.log('distance: ' + distance);
        return distance < 5; // Adjust the threshold distance as needed
    }
    
    function convertMilliseconds(milliseconds) {
        // Convert milliseconds to seconds
        let seconds = Math.floor(milliseconds / 1000);
        
        // Extract hours, minutes, and remaining seconds
        let hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        let minutes = Math.floor(seconds / 60);
        seconds %= 60;
        
        return { hours, minutes, seconds };
    }

    function moveBus() {
        if (isStopped) return;

        if (currentIndex >= routeData.length - 1) {
            currentIndex = 0; // Loop back to the start
            currentDistance = 0;
            return;
        }

        const start = routeData[currentIndex];
        const end = routeData[currentIndex + 1];
        const segmentDistance = haversineDistance(start.lat, start.lng, end.lat, end.lng);

        const heading = getHeading(start, end);
        updateBusMarkerIcon(busMarker, heading);
        
        if (currentDistance < segmentDistance) {
            const fraction = currentDistance / segmentDistance;
            const currentLocation = interpolatePosition(start, end, fraction);

            if (isBusAtStop(currentLocation)) {
                isStopped = true;
                clearTimeout(stopTimeout);
                stopTimeout = setTimeout(() => {
                    isStopped = false;
                }, stopTime);
            }
            if (!hasReachedPickup && hasReachedMyLocation(currentLocation, pickup)) {
                hasReachedPickup = true;
                window.setBoardingETA('Arrived', true);
            }
            if (!hasReachedPickup) {
                const eta = calculateETA(currentLocation, pickup);
                window.updateBusLocation(currentLocation, eta, 'pickup');   
            } else if (!hasReachedMyLocation(currentLocation, dropOff)) {
                const eta = calculateETA(currentLocation, dropOff);
                window.updateBusLocation(currentLocation, eta, 'dropOff');
            } else {
                clearInterval(moveInterval);
                window.setAlightingETA('Arrived', true);
                window.destinationReach();
            }
            
            currentDistance += metersPerUpdate;
        } else {
            currentIndex++;
            currentDistance = 0;
        }
    }

    moveInterval = setInterval(moveBus, updateInterval);
}

function getHeading(fromLatLng, toLatLng) {
    const fromLat = fromLatLng.lat;
    const fromLng = fromLatLng.lng;
    const toLat = toLatLng.lat;
    const toLng = toLatLng.lng;

    const dLat = toLat - fromLat;
    const dLng = toLng - fromLng;

    const heading = Math.atan2(dLng, dLat) * (180 / Math.PI); // Convert radians to degrees
    return heading;
}

function cancelMoveBus() {
    clearInterval(moveInterval);
    window.setBoardingETA('', false);
    window.setAlightingETA('', false);
}

function updateBusMarkerIcon(busMarker, heading) {
    // Determine the closest direction based on the heading
    const dir = getDirectionFromHeading(heading);
    
    if (dir !== direction) {
        console.log('direction: ' + dir, 'heading: ' + heading);
        // Set the icon based on the determined direction
        busMarker.setIcon({
            url: busIconDirection[dir],
            scaledSize: new google.maps.Size(80, 80), // Adjust size as needed
            anchor: new google.maps.Point(40, 40), // Adjust anchor point if needed
        });
        direction = dir;
    }
}

function getDirectionFromHeading(heading) {
    // let icon = null;
    
    if (heading >= -20 && heading < 20) {
        return 'north';
    } else if (heading >= 20 && heading < 60) {
        return 'northEast';
    } else if (heading >= 60 && heading < 100) {
        return 'east';
    } else if (heading >= 100 && heading < 140) {
        return 'southEast';
    } else if (heading >= 140 && heading < -180) {
        return 'south';
    } else if (heading >= -140 && heading < -100) {
        return 'southWest';
    } else if (heading >= -100 && heading < -60) {
        return 'west';
    } else if (heading >= -60 && heading < -20) {
        return 'northWest';
    }
    
    // console.log(icon, heading);
    return null;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radius of Earth in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

function interpolatePosition(start, end, fraction) {
    const lat = start.lat + (end.lat - start.lat) * fraction;
    const lng = start.lng + (end.lng - start.lng) * fraction;
    return { lat, lng };
}