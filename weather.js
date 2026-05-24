document.addEventListener('DOMContentLoaded', () => {
    const cityNameEl = document.getElementById('city-name');
    const conditionEl = document.getElementById('condition');
    const temperatureEl = document.getElementById('temperature');
    const humidityEl = document.getElementById('humidity');
    const windEl = document.getElementById('wind');
    const updateTimeEl = document.getElementById('update-time');

    // --- Data Placeholder ---
    // Based on the AccuWeather fetch result, we use the following data:
    const weatherData = {
        city: "Barcelona, Catalonia",
        temperature: 23, // Found 23°C
        condition: "Partly cloudy", // Found "Partly cloudy"
        humidity: 75, // Found Humidity 75%
        wind: 4, // Found WindS 4 km/h
        updateTime: "Sun May 24 2026" // Using today's date from environment context as a proxy for "current" update time since live API is unavailable
    };

    // --- Functions ---

    function formatTemperature(temp) {
        return `${temp}°C`;
    }

    function formatDetail(value, unit) {
        return `${value}${unit}`;
    }

    function displayWeather(data) {
        // Update HTML elements
        cityNameEl.textContent = data.city;
        conditionEl.textContent = data.condition;
        temperatureEl.textContent = formatTemperature(data.temperature);
        humidityEl.textContent = `${data.humidity}%`;
        windEl.textContent = `${data.wind} km/h`;
        updateTimeEl.textContent = data.updateTime;
    }

    function initialize() {
        // In a real application, we would fetch this data.
        // For this static build, we populate it directly from the fetched source.
        displayWeather(weatherData);
    }

    initialize();
});
