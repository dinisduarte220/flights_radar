// Extract the currente view mode (icao / loc) from the URL
const pathParts = window.location.pathname.split('/')
const viewLoc = pathParts[3]
const viewMode = pathParts[2]

let map

let lon = 0, lat = 0, dist
initializeView()

const existingFlights = new Map()
const existingMarkers = new Map()

async function initializeView() {
  if (viewMode === "airport") {
    try {
      const data = await getAirportData(viewLoc)
      lon = data.longitude
      lat = data.latitude

      map = new maplibregl.Map({
        container: "map",
        style: "https://api.jawg.io/styles/jawg-dark.json?access-token=zyLDUYMkhQ8nsbh3NFInHcUxLoxFUPjIVXadZWrhSSKlG9LRXFceIrP4vMErY9dy",
        center: [lon, lat],
        zoom: 10,
      });
      const marker = document.createElement('img')
      marker.src = "../../../assets/mapPoint.png"
      marker.style.width = "20px"
      marker.style.height = "20px"
      new maplibregl.Marker({
        element: marker
      })
      .setLngLat([lon, lat])
      .addTo(map);
    } catch (error) {
      console.error(error)
      showNotification("Ocorreu um erro ao obter informações do aeroporto")
      map = new maplibregl.Map({
        container: "map",
        style: "https://api.jawg.io/styles/jawg-dark.json?access-token=zyLDUYMkhQ8nsbh3NFInHcUxLoxFUPjIVXadZWrhSSKlG9LRXFceIrP4vMErY9dy",
        center: [-9.0, 38.7],
        zoom: 10,
      })

      map.addControl(new maplibregl.NavigationControl());
      map.addControl(
      new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        })
      )
    }
  } else {
    // Location mode coords: XX.XX,XX.XX
    const coords = viewLoc.split(',')
    lon = coords[0]
    lat = coords[1]
    map = new maplibregl.Map({
        container: "map",
        style: "https://api.jawg.io/styles/jawg-dark.json?access-token=zyLDUYMkhQ8nsbh3NFInHcUxLoxFUPjIVXadZWrhSSKlG9LRXFceIrP4vMErY9dy",
        center: [lon, lat],
        zoom: 10,
    });
      const marker = document.createElement('img')
      marker.src = "../../../assets/mapPoint.png"
      marker.style.width = "20px"
      marker.style.height = "20px"
      new maplibregl.Marker({
        element: marker
      })
      .setLngLat([lon, lat])
      .addTo(map);
  }

  const settings = JSON.parse(localStorage.getItem('settings'))
  dist = settings.radar_radius

  const updateTimer = 4500
  if (lon != null && lat != null) {
    getFlights()
    setInterval(async () => {
      getFlights()
    }, updateTimer);
  }

map.on('zoom', () => {
    const zoom = map.getZoom()
    const scale = Math.min(Math.pow(2, (zoom - 10) / 2), 2)

    existingMarkers.forEach(marker => {
        const line = marker.getElement().querySelector('.airplane_line')
        const height = 35 * scale

        line.style.height = `${height}px`
        line.style.top = `${-height / 2}px`
    })
})
}

async function getFlights() {
  try {
    const flights = []
    const data = await getFlightsData(lon, lat, dist)
    const flights_data = data.ac

    flights_data.forEach(flight => {
      if (
        flight.flight == null ||
        flight.lat == null ||
        flight.lon == null ||
        flight.true_heading == null ||
        flight.alt_baro < 150 ||
        // flight.alt_baro == "ground" ||
        flight.seen > 180
      ) return
      
      const currentFlight = existingFlights.get(flight.hex)
      flights.push({
        icao: flight.hex,    // Unique identifier
        callsign: flight.flight?.trim(),    // Callsign
        model: flight.t,    // Model
        registration: flight.r,    // Registration
        description: flight.desc,    // Description
        speed: flight.ias,    // Speed
        ground_speed: flight.gs,    // Ground Speed
        altitude: flight.alt_baro,    // Altitude
        ap_altitude: Math.round(flight.nav_altitude_mcp / 100) * 100,    // Assigned Altitude
        rate: flight.baro_rate,    // Vertical Rate
        heading: flight.true_heading,    // Heading
        track: flight.track,    // Track
        latitude: currentFlight ? currentFlight.target_latitude : flight.lat,    // Latitude
        longitude: currentFlight ? currentFlight.target_longitude : flight.lon,    // Longitude
        target_latitude: flight.lat,
        target_longitude: flight.lon,
        squawk: flight.squawk,    // Squawk
        last_seen: flight.seen    // Last Update
      })
    });

    // Compare both Map and Flights Array:
    // Add new flights, update existing and remove old ones
    flights.forEach(element => {
      existingFlights.set(element.icao, element)
    })
    existingFlights.forEach((element, icao) => {
      if(!flights.some(flight => flight.icao === icao)) {
        existingFlights.delete(icao)
        let marker = existingMarkers.get(icao)
        marker.remove()
        existingMarkers.delete(icao)
      }
    })
  } catch (error) {
    console.error(error)
    return null
  }
  updateFlights()
}

function updateFlights() {
  existingFlights.forEach(element => {
    if (existingMarkers.has(element.icao)) {
      const marker = existingMarkers.get(element.icao)
      marker.setLngLat([element.longitude, element.latitude])

      let alt_icon    // Altitude ICON: Climbing or Descending
      if (element.altitude > element.ap_altitude && element.rate < 0) {
        alt_icon = "⇘"
      } else if (element.altitude < element.ap_altitude && element.rate > 0) {
        alt_icon = "⇗"
      } else {
        alt_icon = " "
      }

      const markerElement = marker.getElement()
      
      
      if (element.altitude == "ground") {
        markerElement.querySelector('.airplane_line').style.display = "none"
      } else {
        markerElement.querySelector('.airplane_line').style.display = "block"
      }
      markerElement.querySelector('.airplane_line').style.transform = `translate(-50%, -50%) rotate(${element.track}deg)`
      markerElement.querySelector('.airplane_info').innerHTML = `
        <div>${element.callsign}</div>
        <div>${element.model} ${alt_icon} ${element.ap_altitude}</div>
      `
    } else {
      const airplaneMarker = document.createElement('div')
      airplaneMarker.className = "airplane_marker"
      airplaneMarker.addEventListener('click', () => {
        const currentFlight = existingFlights.get(element.icao)
        console.log(currentFlight)
      })
      const position = document.createElement('div')
      position.className = "airplane_pos"

      const line = document.createElement('div')
      line.className = "airplane_line"
      line.style.transform = `translate(-50%, -50%) rotate(${element.track}deg)`
      if (element.altitude == "ground") line.style.display = "none"

      let alt_icon    // Altitude ICON: Climbing or Descending
      if (element.altitude > element.ap_altitude && element.rate < 0) {
        alt_icon = "⇘"
      } else if (element.altitude < element.ap_altitude && element.rate > 0) {
        alt_icon = "⇗"
      } else {
        alt_icon = " "
      }
      const info = document.createElement('div')
      info.className = "airplane_info"
      info.innerHTML = `
        <div>${element.callsign}</div>
        <div>${element.model} ${alt_icon} ${element.ap_altitude}</div>
      `

      airplaneMarker.appendChild(position)
      airplaneMarker.appendChild(line)
      airplaneMarker.appendChild(info)

      const newMarker = new maplibregl.Marker({
        element:airplaneMarker,
        anchor: 'center'
      })
      .setLngLat([element.longitude, element.latitude])
      .addTo(map)

      existingMarkers.set(element.icao, newMarker)
    }
    if (existingMarkers.has(element.icao)) {
      const marker = existingMarkers.get(element.icao)
      animateFlight(
        marker,
        element.latitude,
        element.longitude,
        element.target_latitude,
        element.target_longitude,
        4500
      )
    }
  })
}

// Flights Animation
function animateFlight(marker, startLat, startLon, targetLat, targetLon, duration) {
  const startTime = performance.now()

  function animate(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1)

    const lat = startLat + (targetLat - startLat) * progress
    const lon = startLon + (targetLon - startLon) * progress

    marker.setLngLat([lon, lat])

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}


if (!localStorage.getItem('settings')) {
  const defaultSettings = {
    "radar_radius": 25,
    "planes_icon": "icon",
    "show_marker": true,
    "label_info": ["callsign", "model", "selected_altitude"]
  }

  localStorage.setItem('settings', JSON.stringify(defaultSettings))
}

// Settings
const settingsWidget = document.getElementById('settingsBar')
function showSettings() {
  if (settingsWidget.style.display == "none") {
    settingsWidget.style.display = "flex"
    const settings = JSON.parse(localStorage.getItem('settings'))

    settingsWidget.querySelector('#radar_range').value = settings.radar_radius
    settingsWidget.querySelector('#planes_icon').value = settings.planes_icon
    settingsWidget.querySelector('#checkbox_showLocation').checked = settings.show_marker

    settings.label_info.forEach(element_setting => {
      settingsWidget.querySelector(`#label_${element_setting}`).checked = true
    });
    verifyCheckBoxes()
  } else {
    settingsWidget.style.display = "none"
  }
}
// Limit the Labels info to 3 options
function verifyCheckBoxes() {
  const availableCheckBoxs = ["callsign", "route", "altitude", "selected_altitude", "speed", "squawk", "model", "registration", "rate"]
  const limit = 3
  let counter = 0
  const settingsWidget = document.getElementById('settingsBar')

  availableCheckBoxs.forEach(checkbox => {
    if (settingsWidget.querySelector(`#label_${checkbox}`).checked == true) counter++
    if (counter == limit) {
      availableCheckBoxs.forEach(checkBoxToDisable => {
        if (settingsWidget.querySelector(`#label_${checkBoxToDisable}`).checked == false) settingsWidget.querySelector(`#label_${checkBoxToDisable}`).disabled = true
      })
    } else {
      availableCheckBoxs.forEach(checkBoxToDisable => {
        if (settingsWidget.querySelector(`#label_${checkBoxToDisable}`).checked == false) settingsWidget.querySelector(`#label_${checkBoxToDisable}`).disabled = false
      })
    }
  })
}
// Save Settings
function saveSettings() {
  const settingsWidget = document.getElementById('settingsBar')
  const availableCheckBoxs = ["callsign", "route", "altitude", "selected_altitude", "speed", "squawk", "model", "registration", "rate"]
  let labelsInfo = []

  availableCheckBoxs.forEach(element_setting => {
    if (settingsWidget.querySelector(`#label_${element_setting}`).checked == true) labelsInfo.push(element_setting)
  });

  const newSettings = {
    "radar_radius": settingsWidget.querySelector('#radar_range').value,
    "planes_icon": settingsWidget.querySelector('#planes_icon').value,
    "show_marker": settingsWidget.querySelector('#checkbox_showLocation').checked,
    "label_info": labelsInfo
  }
  
  localStorage.setItem('settings', JSON.stringify(newSettings))

  settingsWidget.style.display = "none"
}

function updateRadar() {
  const settings = JSON.parse(localStorage.getItem('settings'))


}

// Radius
let radiusTimeout
const radiusTimer = 1500    // 1.5 Seconds
function drawRadius(radius) {

  clearTimeout(radiusTimeout)

  radiusTimeout = setTimeout(() => {
    if (map.getLayer("radar_radius")) map.removeLayer("radar_radius")
    if (map.getLayer("radar_radius_outline")) map.removeLayer("radar_radius_outline")
    if (map.getSource("radar_radius")) map.removeSource("radar_radius")
    
    return
  }, radiusTimer);
  const options = {
    steps: 85,
    units: "nauticalmiles"
  }
  const circle = turf.circle([lon, lat], radius, options)

  if (map.getSource("radar_radius")) {
    map.getSource("radar_radius").setData(circle)
    return
  }

  map.addSource("radar_radius", {
    type: "geojson",
    data: circle
  })

  map.addLayer({
    id: "radar_radius",
    type: "fill",
    source: "radar_radius",
    paint: {
      "fill-color": "#8CCFFF",
      "fill-opacity": 0.5
    }
  })
  map.addLayer({
    id: "radar_radius_outline",
    type: "line",
    source: "radar_radius",
    paint: {
      "line-color": "#0094ff",
      "line-width": 3
    }
  })
}