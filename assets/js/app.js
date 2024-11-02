let map;
let busMarker;
let markers = [];
var notes = [];

let selectedPickupID = null;
let selectedDropOffID = null;
let userLocation = null;

const signInButton = document.querySelector('.sign-in');
const heroSection = document.querySelector('.hero');
const elements = document.querySelectorAll('.actions');
const steps = document.querySelectorAll('.step');
const progressAnimation = document.getElementById('progressAnimation');
const noteCount = document.getElementById('noteCount');

const defaultMarkerIcon = 'assets/images/home/markers/busMarkerBench.png';
const pickupIcon = 'assets/images/home/markers/pick.png';
const dropOffIcon = 'assets/images/home/markers/drop.png';
var busIcon = 'assets/images/home/markers/busPic2.png';
var busIconFlip = 'assets/images/home/markers/busPicFlip.png';

let bgPickup = null;
let bgDropOff = null;

let pickup_info = null;
let drop_off_info = null;
let pickup_info_eta = null;
let drop_off_info_eta = null;

let pickupPanorama;
let dropOffPanorama;

let busStops;
let routes = [];

// Example usage: adding a marker at position (100, 100)
const mapElement = document.getElementById('map');
const position = { x: 100, y: 100 };

window.onload = () => {
    var token = sessionStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'signin';
    }
    
    return new Promise((resolve, reject) => {
        const apiUrl = 'api?action=validate_token';
        
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.status == 200) {
                return response.json();
            }
            window.location.href = 'signin';
        })
        .then(res => {
            if (res.success) {
                initMap();
                resolve(res.data);
            } else {
                window.location.href = 'signin';
            }
        })
        .catch(error => {
            window.location.href = 'signin';
        });
    });
};

function checkScreenSize() {
    const mapContainer = document.querySelector('.map-container');
    
    if (window.innerWidth < 768) { 
        mapContainer.classList.add('no-bottom-radius');
        bgPickup = document.getElementById('bg_pickup_sm');
        bgDropOff = document.getElementById('bg_drop_off_sm');
        
        pickup_info = document.getElementById('pickup_info_sm');
        drop_off_info = document.getElementById('drop_off_info_sm');
        pickup_info_eta = document.getElementById('pickup_info_eta_sm');
        drop_off_info_eta = document.getElementById('drop_off_info_eta_sm');
    } else {
        mapContainer.classList.remove('no-bottom-radius');
        bgPickup = document.getElementById('bg_pickup');
        bgDropOff = document.getElementById('bg_drop_off');
        
        pickup_info = document.getElementById('pickup_info');
        drop_off_info = document.getElementById('drop_off_info');
        pickup_info_eta = document.getElementById('pickup_info_eta');
        drop_off_info_eta = document.getElementById('drop_off_info_eta');
    }
    
}

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -34.020525, lng: 22.475539 },
        zoom: 12,
        mapId: "DEMO_MAP_ID",
        gestureHandling: 'greedy' 
    });

    
    google.maps.event.addListenerOnce(map, 'idle', function() {
        onMapLoaded();
    });
}

function onMapLoaded() {
    Promise.all([
            handleDeviceLocation(),
            getAllBusStops()
        ]).then(() => {
            stopProgressAnimation(); // Stop animation after both are completed
            animateAllBusStopMarkers();
        }).catch(error => {
            if (error.code === error.PERMISSION_DENIED) {
                addNotification("We noticed that location access is denied. Please consider enabling location sharing for a more enhanced experience.");
            } else {
                addNotification("There was an error accessing your location. Please try again or check your location settings.");
            }
            stopProgressAnimation();
        });
        
    notifyNote();
    checkScreenSize();
    setEventListenersForElements();
}

function animateAllBusStopMarkers() {
    markers.forEach((position, index) => {
        setTimeout(() => {
            markers[index].marker.setIcon(defaultMarkerIcon);
            markers[index].marker.setAnimation(google.maps.Animation.DROP);
        }, index * 300);
    });
    // setTimeout(moveMapToClosestBusStop, 3000);
}

function handleDeviceLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    
                    userLocation = pos;
                    map.setCenter(pos);

                    const marker = new google.maps.marker.AdvancedMarkerElement({
                        map: map,
                        position: pos
                    });
                    
                    resolve(pos); // Resolve promise on success
                },
                () => {
                    reject("Error setting device location"); // Reject promise on error
                }
            );
        } else {
            reject("Geolocation is not supported by this browser."); // Reject promise if geolocation is not supported
        }
    });
}

//******************* Progress Animation ******************//
function startProgressAnimation() {
    const progressAnimation = document.getElementById('progressAnimation');
    const mapContainer = document.querySelector('.map-container');
    const actionsContainer = document.querySelector('.actions-container');
    
    progressAnimation.style.display = 'block';
    progressAnimation.classList.add('infoWindowPopup');
    mapContainer.style.animationPlayState = 'running';
    
    const progressAnimationA = document.getElementById('progressAnimationActions');
    progressAnimationA.style.display = 'block';
    progressAnimationA.classList.add('infoWindowPopup');
    actionsContainer.style.animationPlayState = 'running';
}

function stopProgressAnimation() {
    const progressAnimation = document.getElementById('progressAnimation');
    const mapContainer = document.querySelector('.map-container');
    
    progressAnimation.style.display = 'none';
    mapContainer.style.animationPlayState = 'paused';
    
    const progressAnimationA = document.getElementById('progressAnimationActions');
    const actionsContainer = document.querySelector('.actions-container');
    
    progressAnimationA.style.display = 'none';
    actionsContainer.style.animationPlayState = 'paused';
}

//************************ Events ************************//
function setEventListenersForElements() {
    window.addEventListener('resize', checkScreenSize);

    elements.forEach(function(element) {
        element.addEventListener('click', function() {
            element.classList.add('clicked');
    
            setTimeout(function() {
                element.classList.remove('clicked');
            }, 500);
        });
    });
    
    window.addEventListener('scroll', function() {
        var heroRect = heroSection.getBoundingClientRect();
        
        if (heroRect.bottom < 0) {
            signInButton.style.display = 'block';
            signInButton.classList.add('infoWindowPopup');
            signInButton.style.right = '20px';
        } else {
            signInButton.style.right = '-200px';
        }
    });

    steps.forEach(function(step) {
        step.addEventListener('click', function() {
            step.classList.add('clicked');
    
            // Reset animation after 0.5s (duration of animation)
            setTimeout(function() {
                step.classList.remove('clicked');
            }, 500);
        });
    });
}

//************************* Bus Stops & Markers *******************//
function getAllBusStops() {
    return new Promise((resolve, reject) => {
        const apiUrl = 'api?action=bus_stops';
        
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(res => {
            if (res.success) {
                busStops = res.data;
                addBusStopsToMap(res.data); // Assuming addBusStopsToMap returns a Promise
                resolve(res.data); // Resolve the promise with the data
            } else {
                reject(res.error);
            }
        })
        .catch(error => {
            console.error('Error fetching bus stops:', error);
            reject(error); // Reject the promise on error
        });
    });
}


function addBusStopsToMap(busStops) {
    return new Promise((resolve, reject) => {
        const markerPromises = busStops.map(stop => {
            return new Promise((markerResolve) => {
                const position = {
                    lat: parseFloat(stop.latitude),
                    lng: parseFloat(stop.longitude)
                };
                const heading = stop.heading;
                const name = stop.Name;
                const id = stop.ID;

                const marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    title: name,
                    icon: null
                });
                
                marker.addListener('click', function() {
                     console.log('Marker was clicked');
                    if (selectedPickupID === id) {
                        unsetPickup(this);
                         
                        closeBusContainer();
                        return;
                    } else if (selectedDropOffID === id) {
                        unsetDropOff(this);
                        
                        closeBusContainer();
                        return;
                    }
                    
                    if (typeof selectedDropOffID !== 'undefined' && selectedDropOffID !== null && selectedDropOffID === id) {
                        unsetPanorama('dropOff');
                        selectedDropOffID = null;
                        
                        closeBusContainer();
                    } else if (typeof selectedPickupID !== 'undefined' && selectedPickupID !== null && selectedPickupID === id) {
                        unsetPanorama('pickup');
                        selectedPickupID = null;
                        
                        closeBusContainer();
                    }
                    
                    if (selectedPickupID === null || (selectedPickupID  !== null && selectedDropOffID !== null)) {
                        onPickup(id);
                    } else if (selectedDropOffID === null) {
                        onDropOff(id);
                    } else {
                        addNotification("Unhandled event. We are looking into this error.");
                    }
                });

                markers.push({ marker: marker, ID: id, pos: position, name: name, heading: heading });
                markerResolve();
            });
        });

    });
}

function setBoardingInfo(info) {
    pickup_info.textContent = info;
}

function setAlightingInfo(info) {
    drop_off_info.textContent = info;
}

function setBoardingETA(info, hasArrived) {
    pickup_info_eta.textContent = info;
    
    if (hasArrived) {
        const marker = getMarkerById(selectedPickupID).marker;
        if (marker) {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
                marker.setAnimation(null);
            }, 2000);
        }
    }
}

function setAlightingETA(info, hasArrived) {
    drop_off_info_eta.textContent = info;
    
    if (hasArrived) {
        const marker = getMarkerById(selectedDropOffID).marker;
        if (marker) {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
                marker.setAnimation(null);
            }, 2000);
        }
    }
}

function clearInfoETA() {
    setBoardingETA('');
    setAlightingETA('');
}

function getMarkerById(id) {
    return markers.find(markerObj => markerObj.ID === id);
}

function onPickup(id) {
    const foundMarkerObj = getMarkerById(id);
    if (!foundMarkerObj.marker) {
        addNotification("The marker you are requesting was not found.");
        return;
    }
    
    selectedPickupID = id;
    setMarkerIcon(pickupIcon, foundMarkerObj.marker);
    setBoardingInfo(foundMarkerObj.name);
    captureStreetView(foundMarkerObj.pos, bgPickup, foundMarkerObj.heading, 'pickup');
}

function onDropOff(id) {
    const foundMarkerObj = getMarkerById(id);
    if (!foundMarkerObj.marker) {
        addNotification("The marker you are requesting was not found.");
        return;
    }
    
    selectedDropOffID = id;
    setMarkerIcon(dropOffIcon, foundMarkerObj.marker);
    setAlightingInfo(foundMarkerObj.name);
    captureStreetView(foundMarkerObj.pos, bgDropOff, foundMarkerObj.heading, 'dropOff');
}

function captureStreetView(location, imgElement, heading, type) {
    const panorama = new google.maps.StreetViewPanorama(imgElement, {
        position: location,
        pov: {
            heading: heading || 0,
            pitch: 10
        },
    });
    
    if (type === 'pickup') {
        pickupPanorama = panorama;
    } else if (type === 'dropOff') {
        dropOffPanorama = panorama;
    } else {
        addNotification("error captureStreetView");
        return;
    }
    
    const panoOptions = {
        linksControl: false,
        panControl: false,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
        },
        enableCloseButton: false,
        fullscreenControl: false,
    };
    
    panorama.setOptions(panoOptions);
    panorama.addListener('pov_changed', () => {
        const pov = panorama.getPov();
        console.log('Heading changed to:', pov.heading);
        // You can add more code here to handle the heading change
      });
    if (selectedDropOffID && selectedPickupID) {
        setTimeout(() => {
            console.log('showing available buses...');
            showAvailableBuses();
        }, 2000);
    }
}


function setMarkerIcon(markerIcon, marker) {
    marker.setIcon(markerIcon);
    marker.setAnimation(google.maps.Animation.DROP);
}

function resetCaptureStreetView(element) {
    if (!element) {
        return;
    }
   
    element.innerHTML = '';
    element.style.backgroundColor = 'transparent';
    map.setStreetView(null);
}

function unsetPickup(marker) {
    selectedPickupID = null;
    setMarkerIcon(defaultMarkerIcon, marker);
    unsetPanorama('pickup');
}

function unsetDropOff(marker) {
    selectedDropOffID = null;
    setMarkerIcon(defaultMarkerIcon, marker);
    unsetPanorama('dropOff');
}

function unsetPanorama(type) {
    if (type === 'pickup') {
        pickupPanorama.setVisible(false);
        pickupPanorama = null;
        bgPickup.style.background = 'transparent';
        setBoardingInfo('');
    } else if (type === 'dropOff') {
        dropOffPanorama.setVisible(false);
        dropOffPanorama = null;
        bgDropOff.style.background = 'transparent';
        setAlightingInfo('');
    }
}

function updateLocationImage(imgElement) {
    if (imgElement) {
        imgElement.style. backgroundImage = "url(" + selectedIcon  + ")";
    } else {
        addNotification('Image element not found.');
    }
}

function resetMarkerIcon(icon) {
    markers.forEach(entry => {
        if (entry.marker.icon === icon) {
            entry.marker.setIcon(defaultMarkerIcon);
        }
    });
}

function isInfoWindowOpen(infoWindow){
    var map = infoWindow.getMap();
    return (map !== null && typeof map !== "undefined");
}

function redirectToSignIn() {
    window.location.href = 'signin';
}

//************************ Closest Bus Stop ***************************//
function getClosestBusStop(userLocation, busStops) {
    let closestStop = null;
    let minDistance = Infinity;
    
    busStops.forEach(stop => {
        const distance = calculateDistance(userLocation, { lat: stop.latitude, lng: stop.longitude });
        if (distance < minDistance) {
            minDistance = distance;
            closestStop = stop;
        }
    });
    
    return closestStop;
}
function panToNearestBusStop(marker) {
    const currentCenter = map.getCenter();
    const numSteps = 100;
    const duration = 1000;
    const stepDuration = duration / numSteps;
    const latStep = (marker.pos.lat - currentCenter.lat()) / numSteps;
    const lngStep = (marker.pos.lng - currentCenter.lng()) / numSteps;
    let step = 0;

    const overlay = new google.maps.OverlayView();
    overlay.onAdd = function() {
        const finger = document.getElementById('finger');
        const tap = document.getElementById('tap_instr');
        finger.style.display = 'block';
        finger.classList.add('infoWindowPopup');

        const animatePan = () => {
            if (step <= numSteps) {
                const newCenter = {
                    lat: currentCenter.lat() + latStep * step,
                    lng: currentCenter.lng() + lngStep * step
                };
                map.panTo(newCenter);

                // Use the map projection to convert lat/lng to pixel
                const projection = map.getProjection();
                const point = projection.fromLatLngToPoint(new google.maps.LatLng(marker.pos.lat, marker.pos.lng));
                const scale = Math.pow(2, map.getZoom());
                const worldCoordinateCenter = projection.fromLatLngToPoint(map.getCenter());
                const pixelOffset = new google.maps.Point(
                    Math.floor((point.x - worldCoordinateCenter.x) * scale),
                    Math.floor((point.y - worldCoordinateCenter.y) * scale)
                );

                // Update the finger's position
                finger.style.left = `${map.getDiv().offsetWidth / 2 + pixelOffset.x}px`;
                finger.style.top = `${map.getDiv().offsetHeight / 2 + pixelOffset.y}px`;

                step++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    google.maps.event.trigger(marker, 'click');
                }, 1000); // Adjust delay as needed
                setTimeout(() => {
                    finger.style.display = 'none';
                }, 3000); 
            }
        };

        const interval = setInterval(animatePan, stepDuration);
    };
    overlay.draw = function() {};
    overlay.setMap(map);
}

function moveMapToClosestBusStop() {
    if (userLocation === null) {
        addNotification("The system did not find your devices location. Enable location sharing to get the best out of Bus Tracker. ");
        return;
    }

    const closestStop = getClosestBusStop(userLocation);
    const closestMarker = markers.find(marker => marker.pos.lat === closestStop.pos.lat && marker.pos.lng === closestStop.pos.lng);

    if (closestMarker) {
        panToNearestBusStop(closestMarker);
    }
}

function simulateFingerClickOnMarker(marker) {
    const finger = document.getElementById('finger');
    finger.style.display = 'block';
    finger.classList.add('infoWindowPopup');
    
    const mapDiv = marker.marker.map.getDiv();

    // Get the projection from the overlay
    const overlay = new google.maps.OverlayView();
    overlay.onAdd = function() {
        const projection = this.getProjection();
        const markerPosition = new google.maps.LatLng(marker.pos.lat, marker.pos.lng);
        const markerPixelPosition = projection.fromLatLngToDivPixel(markerPosition);

        
        finger.style.left = markerPixelPosition.x + 'px';
        finger.style.top = markerPixelPosition.y + 'px';

        setTimeout(() => {
            google.maps.event.trigger(marker, 'click');
            // finger.style.display = 'none';
        }, 1000); // Adjust delay as needed
    };
    overlay.draw = function() {};
    overlay.setMap(marker.marker.map);
}


function stopInstructions() {
    const instruction = document.querySelector('.animation-instruction');
    const start = document.querySelector('.start-point');
    instruction.style.display = 'none';
    start.style.display = 'none';
}

function getClosestBusStop(userLocation) {
    let closestStop = null;
    let minDistance = Infinity;

    if (!markers) {
        addNotification("No markers for bus stop found. The system made an error.");
        return;
    }
    markers.forEach(stop => {
        const distance = calculateDistance(userLocation, { lat: stop.pos.lat, lng: stop.pos.lng });
        if (distance < minDistance) {
            minDistance = distance;
            closestStop = stop;
        }
    });

    return closestStop;
}

// Function to calculate distance between two points (Haversine formula)
function calculateDistance(loc1, loc2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(loc2.lat - loc1.lat);
    const dLng = deg2rad(loc2.lng - loc1.lng);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(loc1.lat)) * Math.cos(deg2rad(loc2.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

//******************Notification & Profile **************************//
function onProfile() {
    const pro = document.getElementById('profile_menu');
    if (pro.style.display == 'none') {
        pro.style.display = 'block';
        pro.classList.add('infoWindowPopup');
    } else {
        pro.style.display = 'none';
    }
}

function addNotification(message) {
    notes.push(message);
    
    notifyNote();
}

function toggleNotification() {
    var card = document.getElementById('notificationCard');
    var list = document.getElementById('notificationList');
    
    if (notes.length > 0) {
        list.innerHTML = '';
        notes.forEach(function(note) {
            var listItem = document.createElement('li');
            listItem.textContent = note;
            list.appendChild(listItem);
        });
        
        card.classList.remove('hide');
        card.classList.add('show');
    } else {
        card.classList.remove('show');
        card.classList.add('hide');
    }
}

function hideNotification() {
    var card = document.getElementById('notificationCard');
    card.classList.remove('show');
    card.classList.add('hide');
    
     notes = [];
     notifyNote();
}

function notifyNote() {
    if (notes.length > 0) {
        noteCount.innerText = notes.length;
    } else {
        noteCount.innerText = '';
    }
}

function onSignOut() {
    sessionStorage.removeItem('authToken');
    window.location.href = 'signin';
}

/*************** Available Buses **********************/
function getAvailableBuses() {
    const pickupID = 15;
    const dropOffID = 21;
    const authToken = sessionStorage.getItem('authToken');
    
    const url = `api?action=available_buses&pickupID=${pickupID}&dropOffID=${dropOffID}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.data.length > 0) {
            hideSkeletonContainer();
            document.getElementById('buses_container').innerHTML = '';
            
            data.data.forEach(bus => {
                createBusElement(bus);
            });
        } else {
            addNotification('No buses found!');
        }
        // Handle the available buses data here
    })
    .catch((error) => {
        if (error.includes('Unauthorized')) {
            onSignout();
        } else {
            addNotification(error);
            
        }
    });
}

function createBusElement(bus) {
    const busElement = document.createElement('div');
    busElement.classList.add('bus-item');
    busElement.onclick = function() { setRoute(bus.route, bus.Name); };
    busElement.innerHTML = `<div class="bus-item-row"><p>${bus.Name}</p><img src="${bus.photo_url}" alt="image of bus ${bus.Name}"></div><p id="bus_item_eta">ETA: ${bus.eta}</p>`;
    
    document.getElementById('buses_container').appendChild(busElement);
}


function onCloseBusContainer() {
    unsetSpots();
    
    setTimeout(() => {
        closeBusContainer();
    }, 500);
}

function unsetSpots() {
    if (selectedPickupID) {
        unsetPickup(getMarkerById(selectedPickupID).marker);
    }
    if (selectedDropOffID) {
        unsetDropOff(getMarkerById(selectedDropOffID).marker);
    }
}

function onCloseReachedContainer() {
    busMarker.setMap(null);
    removeAllRoutes();
    clearInfoETA();
    unsetSpots();
    setTimeout(() => {
        closeReachedContainer();
    }, 500);
}

function showAvailableBuses() {
    const busContainer = document.getElementById('bus_container');
    busContainer.style.display = 'block';
    busContainer.classList.add('infoWindowPopup');
    showSkeletonContainer();
    
    getAvailableBuses();
}

function showSkeletonContainer() {
    const skeletonContainer = document.getElementById('skeleton_container');
    if (skeletonContainer) {
        skeletonContainer.style.display = 'block'
        skeletonContainer.classList.add('infoWindowPopup');
    }
}

function hideSkeletonContainer() {
    const skeletonContainer = document.getElementById('skeleton_container');
    skeletonContainer.classList.add('infoWindowHide');
    setTimeout(() => {
        skeletonContainer.classList.remove('infoWindowHide');
        skeletonContainer.style.display = 'none';
    }, 500);
}

function closeBusContainer() {
    const busContainer = document.getElementById('bus_container');
    busContainer.classList.add('infoWindowHide');
    setTimeout(() => {
        busContainer.style.display = 'none';
        busContainer.classList.remove('infoWindowHide');
    }, 500);
    hideSkeletonContainer();
}

function closeReachedContainer() {
    const reachedContainer = document.getElementById('reached_container');
    reachedContainer.classList.add('infoWindowHide');
    setTimeout(() => {
        reachedContainer.classList.remove('infoWindowHide');
        reachedContainer.style.display = 'none';
    }, 500);
}

function updateBusLocation(location, eta, etaFor) {
    if (busMarker) {
        busMarker.setPosition(location);
        map.panTo(location);
    }
    if (etaFor === 'pickup') {
        setBoardingETA('Arriving in: ' + eta, false);
    } else if (etaFor === 'dropOff') {
        setAlightingETA('Arriving in: ' + eta, false);
    }
}

function destinationReach() {
    const elem = document.getElementById('reached_container');
    elem.style.display = 'block';
    elem.classList.add('infoWindowPopup');
}

function removeAllRoutes() {
    for (let route of routes) {
        route.setMap(null); // Remove the route polyline from the map
    }
    routes = []; // Clear the routes array
}

function onCancelTrack() {
    unsetSpots();
    cancelMoveBus();
    busMarker.setMap(null);
    removeAllRoutes();
    const elem = document.querySelector('.cancel-track');
    elem.classList.add('infoWindowHide');
    setTimeout(() => {
        elem.classList.remove('infoWindowHide');
        elem.style.display = 'none';
    }, 200);
}

function showCancelButton() {
    const elem = document.querySelector('.cancel-track');
    elem.style.display = 'block';
    elem.classList.add('infoWindowPopup');
}

function updateBusMarkerIcon(direction) {
    if (direction === 'left') {
        busMarker.setIcon(busIconFlip);
    } else if (direction === 'right') {
        busMarker.setIcon(busIcon);
    }
    console.log(direction);
}

function setRoute(routeData, busName) {
    routeData = [{"lat": -34.01948, "lng": 22.466990000000003},{"lat": -34.019580000000005, "lng": 22.4675},{"lat": -34.01919, "lng": 22.46761},{"lat": -34.019290000000005, "lng": 22.468220000000002},{"lat": -34.019650000000006, "lng": 22.470270000000003},{"lat": -34.019760000000005, "lng": 22.47098},{"lat": -34.019830000000006, "lng": 22.471660000000004},{"lat": -34.019760000000005, "lng": 22.472140000000003},{"lat": -34.019600000000004, "lng": 22.472550000000002},{"lat": -34.01925, "lng": 22.473000000000003},{"lat": -34.01914, "lng": 22.473570000000002},{"lat": -34.01916, "lng": 22.473650000000003},{"lat": -34.01932, "lng": 22.47427},{"lat": -34.01944, "lng": 22.474700000000002},{"lat": -34.01999, "lng": 22.474970000000003},{"lat": -34.020450000000004, "lng": 22.475150000000003},{"lat": -34.02057, "lng": 22.475440000000003},{"lat": -34.020700000000005, "lng": 22.475980000000003},{"lat": -34.0202, "lng": 22.47717},{"lat": -34.019740000000006, "lng": 22.477400000000003},{"lat": -34.019200000000005, "lng": 22.477590000000003},{"lat": -34.01867, "lng": 22.47783},{"lat": -34.01796, "lng": 22.477780000000003},{"lat": -34.016540000000006, "lng": 22.477680000000003},{"lat": -34.016510000000004, "lng": 22.477670000000003},{"lat": -34.01639, "lng": 22.47756},{"lat": -34.016110000000005, "lng": 22.47728},{"lat": -34.01587, "lng": 22.477030000000003},{"lat": -34.01585, "lng": 22.476550000000003},{"lat": -34.015840000000004, "lng": 22.47585},{"lat": -34.01585, "lng": 22.47575},{"lat": -34.016070000000006, "lng": 22.4752},{"lat": -34.01659, "lng": 22.473820000000003},{"lat": -34.01668, "lng": 22.473200000000002},{"lat": -34.01715, "lng": 22.470460000000003},{"lat": -34.0172, "lng": 22.470160000000003},{"lat": -34.017230000000005, "lng": 22.470070000000003},{"lat": -34.01731, "lng": 22.469920000000002},{"lat": -34.017450000000004, "lng": 22.469810000000003},{"lat": -34.01756, "lng": 22.46975},{"lat": -34.017970000000005, "lng": 22.469600000000003},{"lat": -34.01809, "lng": 22.46955}];
    
    busMarker = new google.maps.Marker({
        position: {
            "lat": -34.01946,
            "lng": 22.46687
        },
        map: map,
        title: busName
    });
    busMarker.setIcon(busIcon);
    const routePath = routeData.map(coord => new google.maps.LatLng(coord.lat, coord.lng));
    
    const route = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    
    route.setMap(map);
    routes.push(route);
    document.getElementById('bus_container').classList.add('infoWindowHide');
    setTimeout(() => {
        document.getElementById('bus_container').classList.remove('infoWindowHide');
        document.getElementById('bus_container').style.display = 'none';
    }, 500);
    
    showCancelButton();
    
    const pickup = (getMarkerById(selectedPickupID)).pos;
    const dropOff = (getMarkerById(selectedDropOffID)).pos;
    if (pickup && dropOff) {
        simulateBusMovement(busMarker, routeData, 50, 1, busStops, pickup, dropOff);
    } else {
        addNotification('Missing route');
    }
}