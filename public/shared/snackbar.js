const notificationDuration = 5000    // Miliseconds
let timer, timerOut    // Create notification timers for automatically hiding

// Create Notification
function showNotification(text) {
  if (!text) return    // Don't run empty calls

  let toast_container = document.getElementById('toasts_container')

  let newNotification = document.createElement('div')
  newNotification.setAttribute('class', 'notification')
  newNotification.setAttribute('onclick', 'hideNotification(this)')
  newNotification.animation = "notification_show 1s"
  let newDescription = document.createElement('div')
  newDescription.setAttribute('class', 'description')
  newDescription.innerHTML = text

  newNotification.appendChild(newDescription)
  toast_container.appendChild(newNotification)

  timerOut = setTimeout(() => {
    newNotification.style.animation = "notification_hide 1s"
  }, notificationDuration - 1000)    // Count the show animation to the full timing
  timer = setTimeout(() => {
    newNotification.remove()
  }, notificationDuration)

}

// Remove Notification
function hideNotification(notification) {
  notification.remove()
}