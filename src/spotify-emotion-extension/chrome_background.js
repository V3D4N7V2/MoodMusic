let accessToken = '';
let moodDetectionActive = false;



const outputElement = document.getElementById('output');
const videoElement = document.createElement('video');
const canvas = document.createElement('canvas');

// Initialize camera stream
async function initializeCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
        await videoElement.play();
    } catch (error) {
        console.error("Camera access error:", error);
        outputElement.innerText = "Error accessing the camera.";
    }
}

// Function to uninitialize the camera stream
function uninitializeCamera() {
    // Check if the video stream is available
    if (videoElement.srcObject) {
        // Get the media stream
        const stream = videoElement.srcObject;
        
        // Stop all tracks of the media stream
        const tracks = stream.getTracks();
        tracks.forEach(track => {
            track.stop();
        });

        // Set the video source object to null
        videoElement.srcObject = null;
    }
}


// Capture image from video stream
async function captureImage() {
    await initializeCamera();
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Convert the canvas image to a Base64 string
    const imageDataUrl = canvas.toDataURL('image/png');
    uninitializeCamera();
    return imageDataUrl;
}

// Button to capture and send the image

async function captAndProcImage() {
    if (outputElement.innerText == "Captured image.") {
        return;
    }
    const imageData = await captureImage();
    outputElement.innerText = "Captured image.";
    // outputElement.innerHTML += `<img src="${imageData}" />`;
    // Bundle the image data into a message
    const message = {
        action: 'classify',
        image: imageData,
    };

    // Send this message to the service worker
    chrome.runtime.sendMessage(message, (response) => {
        // Handle results returned by the service worker (`background.js`) and update the popup's UI.
        console.log(response);
        outputElement.innerText = JSON.stringify(response[0]["label"], null, 2);
    });
}


// document.getElementById('capture-button').addEventListener('click', async () => {
//     await captAndProcImage();
// });

// check expression every 5 seconds
let inve = null;

// Initialize the camera when the popup opens
// initializeCamera();


// Function to authenticate with Spotify
function authenticateWithSpotify() {
    const clientId = ""; // Replace with your actual client ID
    const redirectUri = `chrome-extension://${chrome.runtime.id}/callback`;
    const scopes = "user-read-playback-state user-modify-playback-state user-read-private user-read-email playlist-read-private";

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

    chrome.identity.launchWebAuthFlow(
        {
            url: authUrl,
            interactive: true
        },
        function (redirectUrl) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                return;
            }

            // Parse the token from the URL
            accessToken = new URL(redirectUrl).hash.split("&")[0].split("=")[1];
            console.log("Access Token:", accessToken);
            // Notify popup that authentication is complete
            chrome.runtime.sendMessage({ status: "Authenticated" });
        }
    );
}

// Function to toggle mood detection
function toggleMoodDetection(isActive) {
    moodDetectionActive = isActive;
    if (isActive) {
        startMoodDetection();
    } else {
        stopMoodDetection();
    }
}

// Function to start detecting mood (placeholder for your actual detection logic)
function startMoodDetection() {
    console.log("Mood detection started.");
    inve = setInterval(async () => {
        await captAndProcImage();
    }, 5000);

    // Add your mood detection logic here
}

// Function to stop detecting mood
function stopMoodDetection() {
    console.log("Mood detection stopped.");
    clearInterval(inve);
}

// Function to fetch current track
function getCurrentTrack(sendResponse) {
    fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        sendResponse({ track: data.item });
    })
    .catch(error => {
        console.error('Error fetching current track:', error);
        sendResponse({ error: 'Failed to fetch current track' });
    });
}

// Function to skip to the next track
function skipTrack(sendResponse) {
    fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(() => {
        sendResponse({ status: 'Track skipped' });
    })
    .catch(error => {
        console.error('Error skipping track:', error);
        sendResponse({ error: 'Failed to skip track' });
    });
}

// Message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "authenticate") {
        authenticateWithSpotify();
        sendResponse({ status: "Authentication started" });
    } else if (request.type === "toggleMoodDetection") {
        toggleMoodDetection(request.isActive);
        sendResponse({ status: `Mood detection ${request.isActive ? "enabled" : "disabled"}` });
    } else if (request.type === "getCurrentTrack") {
        getCurrentTrack(sendResponse);
        return true; // Indicate asynchronous response
    } else if (request.type === "skipTrack") {
        skipTrack(sendResponse);
        return true; // Indicate asynchronous response
    }
});
