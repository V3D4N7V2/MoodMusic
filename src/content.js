// content.js - the content scripts which is run in the context of web pages, and has access
// to the DOM and other web APIs.

// Example usage:
// const message = {
//     action: 'classify',
//     text: 'text to classify',
// }
// chrome.runtime.sendMessage(message, (response) => {
//     console.log('received user data', response)
// });


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "embedVideo" && message.url) {
      // Remove any existing iframe
      let existingIframe = document.getElementById("youtube-player");
      if (existingIframe) {
        existingIframe.remove();
      }
      
      // Create a new iframe to embed the video
      const iframe = document.createElement("iframe");
      iframe.src = message.url;
      iframe.id = "youtube-player";
      iframe.width = "560"; // Width for the iframe
      iframe.height = "315"; // Height for the iframe
      iframe.style.position = "fixed";
      iframe.style.bottom = "20px";
      iframe.style.right = "20px";
      iframe.style.zIndex = "1000";
      iframe.allow = "autoplay"; // Allows the iframe to autoplay if supported
  
      // Append the iframe to the body
      document.body.appendChild(iframe);
    }
  });
  