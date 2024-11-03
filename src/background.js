// background.js - Handles requests from the UI, runs the model, then sends back a response

import { pipeline, env } from '@xenova/transformers';


// Skip initial check for local models, since we are not loading any local models.
env.allowLocalModels = false;

// Due to a bug in onnxruntime-web, we must disable multithreading for now.
// See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
env.backends.onnx.wasm.numThreads = 1;

const classifier = await pipeline('image-classification', 'Xenova/facial_emotions_image_detection');


class PipelineSingleton {
    // static task = 'text-classification';
    // static model = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
    // static instance = null;

    static async getInstance(progress_callback = null) {
        // if (this.instance === null) {
        //     this.instance = pipeline(this.task, this.model, { progress_callback });
        // }
        
        // return this.instance;

        const classifier = await pipeline('image-classification', 'Xenova/facial_emotions_image_detection');
        return classifier;

    }
}

let videoElement = null;
let canvas = null;
let document = null;


// // try {
//     document = await chrome.offscreen.createDocument({
//       url: chrome.runtime.getURL('backgroundpage.html'),
//       // reasons: ['CLIPBOARD'],
//       reasons : ['USER_MEDIA'],
//       justification: 'testing the offscreen API',
//     });
//     console.log('Offscreen document created successfully.', document);
//     // videoElement = document.createElement('video');
//     videoElement = document.querySelector('video');
//     // canvas = document.createElement('canvas');
//     canvas = document.querySelector('canvas');
// //   } catch (error) {
// //     console.error('Error creating offscreen document:', error);
// //   }
// //   Error creating offscreen document: TypeError: Cannot read properties of undefined (reading 'createDocument')



try {
    if (!chrome.offscreen || !chrome.offscreen.createDocument) {
        throw new Error("Offscreen API is not available");
    }

    document = await chrome.offscreen.createDocument({
        url: chrome.runtime.getURL('backgroundpage.html'),
        reasons: ['USER_MEDIA'],
        justification: 'testing the offscreen API',
    });

    console.log('Offscreen document created successfully.', document);

    const videoElement = document.querySelector('video');
    const canvas = document.querySelector('canvas');

    if (!videoElement || !canvas) {
        console.error('Video or canvas element not found in the document');
    }

} catch (error) {
    console.error('Error creating offscreen document:', error);
}


function playNewVidCode(code) {
    let newURL = "https://www.youtube.com/embed/"+ code +"?autoplay=1";
    let iframe = document.querySelector('iframe');
    iframe.src = newURL;
    alert("Playing new song: " + newURL);
    // send messaage to content.js
    chrome.runtime.sendMessage({action: "embedVideo", url: newURL}, function(response) {
        console.log(response);
    });
}

// Create generic classify function, which will be reused for the different types of events.
const classify = async (url) => {
    // Get the pipeline instance. This will load and build the model when run for the first time.
    let model = await PipelineSingleton.getInstance((data) => {
        // You can track the progress of the pipeline creation here.
        // e.g., you can send `data` back to the UI to indicate a progress bar
        // console.log('progress', data)
    });

    // Actually run the model on the input text
    let result = await model(url);
    return result;
};

////////////////////// 1. Context Menus //////////////////////
//
// // Add a listener to create the initial context menu items,
// // context menu items only need to be created at runtime.onInstalled
// chrome.runtime.onInstalled.addListener(function () {
//     // Register a context menu item that will only show up for selection text.
//     chrome.contextMenus.create({
//         id: 'classify-selection',
//         title: 'Classify "%s"',
//         contexts: ['selection'],
//     });
// });

// // Perform inference when the user clicks a context menu
// chrome.contextMenus.onClicked.addListener(async (info, tab) => {
//     // Ignore context menu clicks that are not for classifications (or when there is no input)
//     if (info.menuItemId !== 'classify-selection' || !info.selectionText) return;

//     // Perform classification on the selected text
//     let result = await classify(info.selectionText);

//     // Do something with the result
//     chrome.scripting.executeScript({
//         target: { tabId: tab.id },    // Run in the tab that the user clicked in
//         args: [result],               // The arguments to pass to the function
//         function: (result) => {       // The function to run
//             // NOTE: This function is run in the context of the web page, meaning that `document` is available.
//             console.log('result', result)
//             console.log('document', document)
//         },
//     });
// });
//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
// 
// Listen for messages from the UI, process it, and send the result back.
let songs = [["NU9JoFKlaZ0",
"Tfmcjh09Ls8",
"KtNYA4pAGjI",
],[
"mQ2-SkLfldk",
"nspxAG12Cpc",
"WM8bTdBs-cw",
],[
"kXYiU_JCYtU",
"KUwjNBjqR-c",
"ENXvZ9YRjbo",
],[
"_tSLA1Ab-kA",
"JL3RcxHiZBY",
"0Hegd4xNfRo",
],[
"QOMWkL4lO5I",
"9fN7udMAMog",
"ujE3DyEaIbg",
],[
"RFtRq6t3jOo",
"xguIYNjYU1A",
"9ZNkPA_zUd4",
],[
"apBWI6xrbLY",
"pTdihu-mp90",
"GJ2X9SANsME",]];

let averageEmotion = {
    
}

let label2id = {
    "sad": 0,
    "disgust": 1,
    "angry": 2,
    "neutral": 3,
    "fear": 4,
    "surprise": 5,
    "happy": 6
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('sender', sender)
    if (message.action !== 'classify') return; // Ignore messages that are not meant for classification.

    // Run model prediction asynchronously
    (async function () {
        // Perform classification
        let result = await classify(message.image);

        // Send response back to UI
        sendResponse(result);
        let nextSong = songs[label2id[result[0]["label"]]][Math.floor(Math.random()*3)];
        console.log("Next song: ", nextSong);
        alert("Next song: " + nextSong);
        playNewVidCode(nextSong);
    })();

    // return true to indicate we will send a response asynchronously
    // see https://stackoverflow.com/a/46628145 for more information
    return true;
});
//////////////////////////////////////////////////////////////

// const outputElement = document.getElementById('output');
let processing = "";
// if document exist then run the code


// Initialize camera stream
async function initializeCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
        await videoElement.play();
    } catch (error) {
        console.error("Camera access error:", error);
        // outputElement.innerText = "Error accessing the camera.";
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
    // if (outputElement.innerText == "Captured image.") {
    //     return;
    // }
    if (processing == "processing") {
        return;
    }
    processing = "processing";
    const imageData = await captureImage();
    // outputElement.innerText = "Captured image.";
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
        // items[Math.floor(Math.random()*items.length)];
        
        // outputElement.innerText = JSON.stringify(response[0]["label"], null, 2);
        averageEmotion[response[0]["label"]] = averageEmotion[response[0]["label"]] * 0.6 + 1;
    });
    processing = "";
}


// document.getElementById('capture-button').addEventListener('click', async () => {
//     await captAndProcImage();
// });

// check expression every 5 seconds
// let inve = setInterval(async () => {
//     await captAndProcImage();
//     console.log("Background Starting Auto Capt")
// }, 1000)


// chrome.alarms.onAlarm.addListener(async (alarm) => {
//     console.log('Got alarm', alarm);
//     await captAndProcImage();
// });

// Set the alarm to start the auto capture
chrome.alarms.create('auto-capture', { periodinSeconds: 5 },
    async (alarm) => {
        console.log('Alarm created', alarm);
        await captAndProcImage();
        // bestMatchEmotion = Object.keys(averageEmotion).reduce((a, b) => averageEmotion[a] >= averageEmotion[b] ? a : b);
        // console.log("Best match emotion: ", bestMatchEmotion);
        // playNewVidCode("kXYiU_JCYtU");
    }
);

function queue_song() {
    console.log("Queueing song")
    bestMatchEmotion = Object.keys(averageEmotion).reduce((a, b) => averageEmotion[a] >= averageEmotion[b] ? a : b);
    console.log("Best match emotion: ", bestMatchEmotion);
}

chrome.alarms.create('queue_songs', { periodinSeconds: 30 },
    async (alarm) => {
        console.log('Alarm created', alarm);
        queue_song();
    }
);