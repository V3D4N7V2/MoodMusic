let accessToken = '';
let moodDetectionActive = false;

// Function to authenticate with Spotify
function authenticateWithSpotify() {
    const clientId = "aab1ffc368c24a60a291c6705b89f7b1"; // Replace with your actual client ID
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
    // Add your mood detection logic here
}

// Function to stop detecting mood
function stopMoodDetection() {
    console.log("Mood detection stopped.");
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
