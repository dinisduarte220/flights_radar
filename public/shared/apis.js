async function getAirportData(icao) {
  const response = await fetch(`/api/airport/${icao}`)
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`)
  }
  return await response.json()
}

async function getFlightsData(lon, lat, dist) {
  const flightsParams = [lat, lon, dist]
  const response = await fetch(`/api/flights/${flightsParams}`)
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`)
  }
  return await response.json()
}