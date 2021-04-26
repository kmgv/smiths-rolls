function listenForClicks () {
  document.addEventListener('click', e => {


    function reportError (error) {
      console.error(`Could not beastify: ${error}`)
    }

    browser.tabs
        .query({ active: true, currentWindow: true })
        .then(function (tabs) {
          browser.tabs.sendMessage(tabs[0].id, {
            command: 'sort',
          })
        })
        .catch(reportError)
  })
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError (error) {
  document.querySelector('#popup-content').classList.add('hidden')
  document.querySelector('#error-content').classList.remove('hidden')
  console.error(`Failed to execute beastify content script: ${error.message}`)
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs
  .executeScript({ file: '/content_scripts/sort.js' })
  .then(listenForClicks)
  .catch(reportExecuteScriptError)
