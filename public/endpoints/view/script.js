// Extract the currente view mode (icao / loc) from the URL
const pathParts = window.location.pathname.split('/')
const viewLoc = pathParts[3]
const viewMode = pathParts[2]

let map

let lon = 0, lat = 0, dist = 25
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
      });
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

  const updateTimer = 7500
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
        flight.alt_baro < 100 ||
        flight.alt_baro == "ground" ||
        flight.seen > 180
      ) return
      flights.push({
        icao: flight.hex,    // Unique identifier
        callsign: flight.flight?.trim(),    // Callsign
        model: flight.t,    // Model
        registration: flight.r,    // Registration
        description: flight.desc,    // Description
        speed: flight.ias,    // Speed
        ground_speed: flight.gs,    // Ground Speed
        altitude: flight.alt_baro,    // Altitude
        ap_altitude: flight.nav_altitude_mcp,    // Assigned Altitude
        rate: flight.baro_rate,    // Vertical Rate
        heading: flight.true_heading,    // Heading
        track: flight.track,    // Track
        latitude: flight.lat,    // Latitude
        longitude: flight.lon,    // Longitude
        squawk: flight.squawk,    // Squawk
        last_seen: flight.seen    // Last Update
      })
    });

    // Compare both Map and Flights Array:
    // Add new flights, update existing and remove old ones
    flights.forEach(element => {
      if (!existingFlights.has(element.icao)) {
        existingFlights.set(element.icao, element)
      }
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

      const markerElement = marker.getElement()
      markerElement.querySelector('.airplane_line').style.transform = `translate(-50%, -50%) rotate(${element.track}deg)`
      markerElement.querySelector('.airplane_info').innerHTML = `
        <div>${element.callsign}</div>
        <div>${element.model}</div>
        <div>${element.altitude} -> ${element.ap_altitude}</div>
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
      const info = document.createElement('div')
      info.className = "airplane_info"
      info.innerHTML = `
        <div>${element.callsign}</div>
        <div>${element.model}</div>
        <div>${element.altitude} -> ${element.ap_altitude}</div>
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
  })
}