const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');  // Import path module to ensure proper path resolution

const app = express();

app.use(cors());

app.get('/run-script', (req, res) => {
    const scriptPath = path.join(__dirname, 'scraper.py');  // Get the absolute path to scraper.py
    exec(`py ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ message: 'Script execution failed', error: error.message });
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return res.status(500).json({ message: 'Script execution error', error: stderr });
        }
        console.log(`Stdout: ${stdout}`);
        res.status(200).json({ message: 'Script executed successfully', output: stdout });
    });
});

app.listen(3002, () => console.log('Server running on port 3002'));
