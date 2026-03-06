require("dotenv").config();
const express = require("express");
const { getDevices, getAllDevices } = require("./ncentral.service");

const app = express();

app.get("/api/powerbi/devices", async (req, res) => {
    try {
        // const page = req.query.page || 1;
        // const data = await getDevices(page);
        const devices = await getAllDevices();
        res.json(devices);
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/powerbi/summary', async (req, res) => {
    try {

        // const result = await getDevices(1); // busca página 1
        const devices = await getAllDevices();      // 🔥 aqui está o ajuste

        if (!devices || devices.length === 0) {
            return res.json({
                totalDevices: 0,
                online: 0,
                offline: 0,
                windows: 0,
                mac: 0,
                linux: 0
            });
        }

        const now = new Date();
        let online = 0;
        let offline = 0;
        let windows = 0;
        let mac = 0;
        let linux = 0;

        devices.forEach(device => {

            if (!device.lastApplianceCheckinTime) {
                offline++;
                return;
            }

            const lastCheckin = new Date(device.lastApplianceCheckinTime);
            const diffHours = (now - lastCheckin) / (1000 * 60 * 60);

            if (diffHours <= 24) online++;
            else offline++;

            const os = (device.supportedOs || '').toLowerCase();

            if (os.includes('windows')) windows++;
            else if (os.includes('mac')) mac++;
            else if (os.includes('linux')) linux++;
        });

        res.json({
            totalDevices: devices.length,
            online,
            offline,
            windows,
            mac,
            linux
        });

        console.log(devices.map(d => d.status));

    } catch (error) {
        console.error('Erro no summary:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/debug/device-classes', async (req, res) => {
    const devices = await getAllDevices();

    const classes = {};

    devices.forEach(d => {
        const cls = d.deviceClass || "UNKNOWN";
        classes[cls] = (classes[cls] || 0) + 1;
    });

    res.json(classes);
});

app.get('/api/powerbi/devices/by-customer', async (req, res) => {
    try {
        const devices = await getAllDevices();
        const now = new Date();

        const result = {};

        devices.forEach(d => {
            const customer = d.customerName || "Sem Cliente";

            if (!result[customer]) {
                result[customer] = {
                    customer,
                    total: 0,
                    online: 0,
                    offline: 0
                };
            }

            result[customer].total++;

            if (!d.lastApplianceCheckinTime) {
                result[customer].offline++;
                return;
            }

            const lastCheckin = new Date(d.lastApplianceCheckinTime);
            const diffHours = (now - lastCheckin) / (1000 * 60 * 60);

            if (diffHours <= 24) result[customer].online++;
            else result[customer].offline++;
        });

        res.json(Object.values(result));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/powerbi/devices/by-site', async (req, res) => {
    try {
        const devices = await getAllDevices();
        const result = {};

        devices.forEach(d => {
            const site = d.siteName || "Sem Site";

            if (!result[site]) {
                result[site] = {
                    site,
                    total: 0
                };
            }

            result[site].total++;
        });

        res.json(Object.values(result));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/powerbi/devices/by-os', async (req, res) => {
    try {
        const devices = await getAllDevices();
        const result = {};

        devices.forEach(d => {
            const os = (d.supportedOs || "Unknown").toLowerCase();

            let normalizedOS = "Outros";

            if (os.includes("windows")) normalizedOS = "Windows";
            else if (os.includes("linux")) normalizedOS = "Linux";
            else if (os.includes("mac")) normalizedOS = "Mac";

            if (!result[normalizedOS]) {
                result[normalizedOS] = {
                    os: normalizedOS,
                    total: 0
                };
            }

            result[normalizedOS].total++;
        });

        res.json(Object.values(result));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/powerbi/devices/offline', async (req, res) => {
    try {
        const devices = await getAllDevices();
        const now = new Date();

        const offlineDevices = devices.filter(d => {

            if (!d.lastApplianceCheckinTime) return true;

            const lastCheckin = new Date(d.lastApplianceCheckinTime);
            const diffHours = (now - lastCheckin) / (1000 * 60 * 60);

            return diffHours > 24;
        });

        res.json(offlineDevices);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`API Power BI rodando na porta ${process.env.PORT}`);
});

