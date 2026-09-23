document.addEventListener("keydown", e => {
    let icao = document.getElementById('airport_selector').value
    if (icao.length == 4 && e.key == "Enter") checkAirport(icao)
})

async function checkAirport(icaoSearch) {
    try {
        const data = await getAirportData(icaoSearch)
        window.location.href = `/view/airport/${data.icao}`
    } catch (error) {
        console.error(error.message)
        showNotification("Ocorreu um erro a obter dados do aeroporto selecionado")
    }
}

// Obtain user location
function userLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error)
    } else {
        showNotification("Geolocation não é suportado neste navegador")
    }
}

function success(position) {
    window.location.href = `/view/location/${position.coords.longitude},${position.coords.latitude}`
}

function error() {
    showNotification("Não foi possível obter a sua localização")
}