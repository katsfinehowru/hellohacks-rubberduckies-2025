console.log("calendar_script.js loaded");

const eventName = "Hello Hacks";
const eventTime = "October 5, 2025, 12:00 PM";

const eventInfoDiv = document.getElementById("event-info");
const backButton = document.getElementById("backButton");

if (eventInfoDiv) {
    console.log("event-info div found");
    eventInfoDiv.innerHTML = `<p><strong>Event:</strong> ${eventName} <br> <strong>Time:</strong> ${eventTime}</p>`;
} else {
    console.log("event-info div NOT found");
}

if (backButton) {
    console.log("backButton found");
    backButton.addEventListener("click", () => {
        window.location.href = "index.html";
    });
} else {
    console.log("backButton NOT found");
}