/**
 * Geolocation utility using IP-based country detection
 * Provides country information from IP addresses
 */

// Free IP geolocation services cache
const geoCache = {};

// Get country from IP address using free API
async function getCountryFromIP(ipAddress) {
    // Skip private IPs
    if (isPrivateIP(ipAddress)) {
        return 'Local/Private';
    }

    // Check cache first
    if (geoCache[ipAddress]) {
        return geoCache[ipAddress];
    }

    try {
        // Using ip-api.com free tier (no API key needed, 45 requests/minute limit)
        const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=country,countryCode`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const country = `${data.country} (${data.countryCode})`;
            geoCache[ipAddress] = country;
            return country;
        }
    } catch (error) {
        console.log(`Could not fetch country for IP ${ipAddress}: ${error.message}`);
    }

    // Fallback: Try alternative service (ipify)
    try {
        const response = await fetch(`https://geo.ipify.org/api/v2/country?ipAddress=${ipAddress}`);
        const data = await response.json();
        
        if (data && data.location && data.location.country) {
            const country = data.location.country;
            geoCache[ipAddress] = country;
            return country;
        }
    } catch (error) {
        console.log(`Fallback geolocation failed: ${error.message}`);
    }

    // Last fallback
    return 'Unknown Location';
}

// Check if IP is private
function isPrivateIP(ip) {
    const privateRanges = [
        /^127\./,                              // Loopback
        /^10\./,                               // Private network
        /^172\.(1[6-9]|2[0-9]|3[01])\./,     // Private network
        /^192\.168\./,                         // Private network
        /^::1$/,                               // IPv6 loopback
        /^fc|^fd/,                             // IPv6 private
        /^localhost$/i                         // Localhost
    ];

    return privateRanges.some(range => range.test(ip));
}

// Get IP address from request
function getClientIP(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return req.ip || req.connection.remoteAddress || '127.0.0.1';
}

// Mock country data for testing (used when geolocation service is unavailable)
function getMockCountry(ipAddress) {
    const mockCountries = {
        '192.168.1.1': 'India (IN)',
        '192.168.1.2': 'United States (US)',
        '192.168.1.3': 'United Kingdom (GB)',
        '192.168.1.4': 'Canada (CA)',
        '192.168.1.5': 'Australia (AU)',
        '192.168.1.6': 'Germany (DE)',
        '192.168.1.7': 'France (FR)',
        '192.168.1.8': 'Japan (JP)',
        '127.0.0.1': 'Local (LO)'
    };

    return mockCountries[ipAddress] || 'Unknown Location';
}

module.exports = {
    getCountryFromIP,
    isPrivateIP,
    getClientIP,
    getMockCountry
};
