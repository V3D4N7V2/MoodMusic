document.getElementById('authButton').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'authenticate' }, (response) => {
        console.log(response.status);
    });
});

document.getElementById('toggleMoodButton').addEventListener('click', () => {
    const isActive = document.getElementById('toggleMoodButton').checked;
    chrome.runtime.sendMessage({ type: 'toggleMoodDetection', isActive }, (response) => {
        console.log(response.status);
    });
});

// Fetch and display current track and mood
function updateCurrentTrack() {
    chrome.runtime.sendMessage({ type: 'getCurrentTrack' }, (response) => {
        if (response.track) {
            document.getElementById('currentTrack').innerText = `Current Track: ${response.track.name} by ${response.track.artists.map(artist => artist.name).join(', ')}`;
        } else {
            console.error(response.error);
        }
    });
}

// Skip current track
document.getElementById('skipButton').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'skipTrack' }, (response) => {
        console.log(response.status);
        updateCurrentTrack(); // Update track after skipping
    });
});

// Call this to refresh the track information when the popup is opened
updateCurrentTrack();
