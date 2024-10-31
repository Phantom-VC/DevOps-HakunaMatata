const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardDiv = document.querySelector(".weather-cards");
const unitToggle = document.getElementById("unit-toggle");
const unitDisplayElements = document.querySelectorAll(".unit-display");

const API_KEY = "160299b39523401281b9790f83de3617";
let currentUnit = "C";

// Fungsi untuk mengonversi suhu berdasarkan satuan yang dipilih
const convertTemperature = (tempK) => {
    if (currentUnit === "C") {
        return (tempK - 273.15).toFixed(2); // Konversi ke Celsius
    } else {
        return ((tempK - 273.15) * 9/5 + 32).toFixed(2); // Konversi ke Fahrenheit
    }
};

// Fungsi untuk membuat kartu cuaca berdasarkan indeks
const createWeatherCard = (cityName, weatherItem, isMainCard) => {
    const date = weatherItem.dt_txt.split(" ")[0];
    const temp = convertTemperature(weatherItem.main.temp);
    const iconUrl = `https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@${isMainCard ? 4 : 2}x.png`;
    const description = weatherItem.weather[0].description;
    const windSpeed = weatherItem.wind.speed;
    const humidity = weatherItem.main.humidity;

    return isMainCard ? `
        <div class="details">
            <h2>${cityName} (${date})</h2>
            <h4>Temperature: ${temp} °<span class="unit-display">${currentUnit}</span></h4>
            <h4>Wind: ${windSpeed} m/s</h4>
            <h4>Humidity: ${humidity}%</h4>
        </div>
        <div class="icon">
            <img src="${iconUrl}" alt="weather-icon">
            <h4>${description}</h4>
        </div>` 
    : `
        <li class="card">
            <h3>${date}</h3>
            <img src="${iconUrl}" alt="weather-icon">
            <h4>Temp: ${temp} °<span class="unit-display">${currentUnit}</span></h4>
            <h4>Wind: ${windSpeed} m/s</h4>
            <h4>Humidity: ${humidity}%</h4>
        </li>`;
};

// Fungsi untuk mengatur data cuaca di DOM
const displayWeatherData = (cityName, forecastData) => {
    currentWeatherDiv.innerHTML = "";
    weatherCardDiv.innerHTML = "";

    forecastData.forEach((weatherItem, index) => {
        const weatherCard = createWeatherCard(cityName, weatherItem, index === 0);
        if (index === 0) {
            currentWeatherDiv.insertAdjacentHTML("beforeend", weatherCard);
        } else {
            weatherCardDiv.insertAdjacentHTML("beforeend", weatherCard);
        }
    });
};

// Fungsi untuk mengambil dan menampilkan detail cuaca
const getWeatherDetails = async (cityName, lat, lon) => {
    try {
        const response = await fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        const data = await response.json();
        
        const cityTimezone = data.city.timezone; // Timezone offset in seconds
        const sunrise = new Date((data.city.sunrise + cityTimezone) * 1000).getTime();
        const sunset = new Date((data.city.sunset + cityTimezone) * 1000).getTime();
        const currentTime = new Date().getTime();

        // Apply the theme based on day or night
        applyThemeBasedOnTime(sunrise, sunset, currentTime);

        // Filter the forecasts to get only one forecast per day
        const uniqueDays = [];
        const fiveDaysForecast = data.list.filter((forecast) => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueDays.includes(forecastDate)) {
                uniqueDays.push(forecastDate);
                return true;
            }
            return false;
        });

        displayWeatherData(cityName, fiveDaysForecast);
    } catch (error) {
        alert("An error occurred while fetching the weather forecast!");
        console.error(error);
    }
};

// Fungsi untuk mendapatkan koordinat berdasarkan nama kota
const getCityCoordinates = async () => {
    const cityName = cityInput.value.trim();
    if (!cityName) return alert("Please enter a city name!");

    try {
        const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`);
        const data = await response.json();

        if (data.length === 0) {
            return alert(`No coordinates found for "${cityName}"`);
        }

        const { name, lat, lon } = data[0];
        getWeatherDetails(name, lat, lon);
        
    } catch (error) {
        alert("An error occurred while fetching the coordinates!");
        console.error(error);
    }
};

// Fungsi untuk mendapatkan koordinat pengguna dan mengonversinya ke nama kota
const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`);
                const data = await response.json();

                if (data.length === 0) {
                    return alert("Could not find your location!");
                }

                const { name } = data[0];
                getWeatherDetails(name, latitude, longitude);

                cityInput.value = ""; // Kosongkan kolom input setelah pencarian berhasil
            } catch (error) {
                alert("An error occurred while fetching the city!");
                console.error(error);
            }
        },
        (error) => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please allow location access to use this feature.");
            } else {
                alert("Unable to retrieve your location. Please try again.");
            }
        }
    );
};

const applyThemeBasedOnTime = (sunrise, sunset, currentTime) => {
    const body = document.body;
    
    // Clear any existing theme
    body.classList.remove("day-theme", "night-theme");
    
    if (currentTime >= sunrise && currentTime < sunset) {
        body.classList.add("day-theme");
    } else {
        body.classList.add("night-theme");
    }
};

// Event listener untuk tombol pencarian dan input
locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", (e) => e.key === "Enter" && getCityCoordinates());

// Event listener untuk dropdown suhu
unitToggle.addEventListener("change", () => {
    currentUnit = unitToggle.value;
    const cityName = document.querySelector(".current-weather .details h2")?.innerText.split(" (")[0];
    if (cityName) getCityCoordinates();
});
