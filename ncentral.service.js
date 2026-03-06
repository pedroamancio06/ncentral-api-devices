const BASE_URL = process.env.NC_BASE_URL;
const JWT_TOKEN = process.env.NC_JWT_TOKEN;

let accessToken = null;
let tokenExpiresAt = null;

// 🔵 CACHE GLOBAL
let devicesCache = null;
let devicesCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function authenticate() {
    const res = await fetch(`${BASE_URL}/api/auth/authenticate`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${JWT_TOKEN}`,
            Accept: "application/json"
        }
    });

    if (!res.ok) {
        throw new Error("Falha ao autenticar no N-central");
    }

    const data = await res.json();
    accessToken = data.tokens.access.token;
    tokenExpiresAt = Date.now() + data.tokens.access.expirySeconds * 1000;
}

async function getAccessToken() {
    if (!accessToken || Date.now() > tokenExpiresAt) {
        await authenticate();
    }
    return accessToken;
}

async function getDevices(page = 1, pageSize = 100) {
    const token = await getAccessToken();

    const res = await fetch(
        `${BASE_URL}/api/devices?pageNumber=${page}&pageSize=${pageSize}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            }
        }
    );

    if (!res.ok) {
        throw new Error("Erro ao buscar devices");
    }

    return res.json();
}

// 🔥 FUNÇÃO COM CACHE
async function getAllDevices() {

    // ✅ Se cache válido, retorna
    if (devicesCache && (Date.now() - devicesCacheTime < CACHE_TTL)) {
        console.log("📦 Usando cache de devices");
        return devicesCache;
    }

    console.log("🌐 Buscando devices do N-central...");

    let page = 1;
    let allDevices = [];
    let totalPages = 1;

    do {
        const result = await getDevices(page, 100);

        if (!result.data) break;

        allDevices = allDevices.concat(result.data);
        totalPages = result.totalPages || 1;
        page++;

    } while (page <= totalPages);

    // 🔵 Atualiza cache
    devicesCache = allDevices;
    devicesCacheTime = Date.now();

    return allDevices;
}

module.exports = {
    getDevices,
    getAllDevices
};