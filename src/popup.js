// // popup.js - handles interaction with the extension's popup, sends requests to the
// // service worker (background.js), and updates the popup's UI (popup.html) on completion.

// const inputElement = document.getElementById('text');
// const outputElement = document.getElementById('output');

// // Listen for changes made to the textbox.
// inputElement.addEventListener('input', (event) => {

//     // Bundle the input data into a message.
//     const message = {
//         action: 'classify',
//         text: event.target.value,
//     }

//     // Send this message to the service worker.
//     chrome.runtime.sendMessage(message, (response) => {
//         // Handle results returned by the service worker (`background.js`) and update the popup's UI.
//         outputElement.innerText = JSON.stringify(response, null, 2);
//     });
// });


// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.

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


document.getElementById('capture-button').addEventListener('click', async () => {
    await captAndProcImage();
});

// check expression every 5 seconds
let inve = setInterval(async () => {
    await captAndProcImage();
}, 5000);

// Initialize the camera when the popup opens
// initializeCamera();
