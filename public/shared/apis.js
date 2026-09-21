async function getAirportData(icao) {
  const response = await fetch(`/api/airport/${icao}`)
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`)
  }
  return await response.json()
}