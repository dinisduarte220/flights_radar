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
    


// Start Server
app.listen(PORT, () => {
    console.log(`\nServer up and running\n\nhttp://localhost:${PORT}`);
});