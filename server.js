require('dotenv').config()

const express = require('express');

const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000

app.use(bodyParser.json());

// Server static files
app.use(express.static(path.join(__dirname, 'public')));

// API CALLS
app.get('/api/airport/:icao' , async (req , res)=>{
    try {
        const icao = req.params.icao.toLowerCase()

        const response = await fetch(`https://airport-data.com/api/ap_info.json?icao=${icao}`)

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Airports API request failed"
            })
        }

        const data = await response.json()
        res.json(data)
    } catch {
        console.error(error)

        res.status(500).json({
            error: "Failed to fetch airport data"
        })
    }
})
app.get('/api/flights/:coords' , async (req , res)=>{
    try {
        const coords = req.params.coords.split(',')    // [lat, lon, dist]

        const response = await fetch(`https://opendata.adsb.fi/api/v3/lat/${coords[0]}/lon/${coords[1]}/dist/${coords[2]}`)

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Flights API Failed"
            })
        }

        const data = await response.json()
        res.json(data)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: "Failed to fetch flights data"
        })
    }
})

// Radar Endpoint
app.use('/view/airport/:icao', express.static(path.join(__dirname, 'public', 'endpoints', 'view')))
app.use('/view/location/:coords', express.static(path.join(__dirname, 'public', 'endpoints', 'view')))

// Start Server
app.listen(PORT, () => {
    console.log(`\nServer up and running\n\nhttp://localhost:${PORT}`);
});