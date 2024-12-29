const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');  // Import the cors package

const app = express();
const port = 3003;

// Enable CORS for all routes
app.use(cors());  // This allows all origins by default

app.get('/analyze-stock/:firmCode', (req, res) => {
    const firmCode = req.params.firmCode;
    const pythonScript = 'getnews.py';
    const command = `py ${pythonScript} --code ${firmCode}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error.message}`);
            res.status(500).send({ error: `Error executing Python script: ${error.message}` });
            return;
        }
        if (stderr) {
            console.error(`Python script error: ${stderr}`);
            res.status(500).send({ error: `Python script error: ${stderr}` });
            return;
        }

        try {
            // Parse the stdout from Python as JSON
            const jsonResponse = JSON.parse(stdout);
            console.log('Parsed JSON response:', jsonResponse);
            res.json(jsonResponse);  // Send the parsed JSON as the response
        } catch (parseError) {
            console.error(`Error parsing JSON: ${parseError.message}`);
            res.status(500).send({ error: 'Error parsing JSON from Python output' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
