document.addEventListener("keydown", e => {
    let icao = document.getElementById('airport_selector').value
    if (icao.length == 4 && e.key == "Enter") checkAirport(icao)
})

async function checkAirport(icaoSearch) {
    try {
        const data = await getAirportData(icaoSearch)
        console.log(data)
    } catch (error) {
        console.error(error.message)
        showNotification("Ocorreu um erro a obter dados do aeroporto selecionado")
    }
}