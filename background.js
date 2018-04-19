chrome.browserAction.onClicked.addListener(updateState);

function updateState() {
    chrome.tabs.executeScript({ file: "contentscript.js" });
}


	


