
const API_BASE = "https://api.open-meteo.com/v1/forecast";
const GEO_BASE = "https://geocoding-api.open-meteo.com/v1/search";

// Application data
const state = {
  city: {
    name: "Dhaka",
    country: "Bangladesh",
    latitude: 23.8103,
    longitude: 90.4125
  },
  weather: null,
  unit: localStorage.getItem("atmos-unit") || "celsius",
  favorites: JSON.parse(localStorage.getItem("atmos-favorites") || "[]")
};

const $ = (selector) => document.querySelector(selector);

const els = {
  searchForm: $("#searchForm"),
  cityInput: $("#cityInput"),
  status: $("#statusMessage"),
  cityName: $("#cityName"),
  currentDate: $("#currentDate"),
  currentTemp: $("#currentTemp"),
  conditionText: $("#conditionText"),
  feelsLike: $("#feelsLike"),
  illustration: $("#weatherIllustration"),
  wind: $("#windValue"),
  humidity: $("#humidityValue"),
  rain: $("#rainValue"),
  uv: $("#uvValue"),
  uvDescription: $("#uvDescription"),
  uvBar: $("#uvBar"),
  windDirection: $("#windDirection"),
  windDirectionText: $("#windDirectionText"),
  visibility: $("#visibilityValue"),
  sunrise: $("#sunriseValue"),
  sunset: $("#sunsetValue"),
  hourly: $("#hourlyForecast"),
  daily: $("#dailyForecast"),
  favorite: $("#favoriteButton"),
  favoritesList: $("#favoritesList"),
  unitToggle: $("#unitToggle")
};

// Open-Meteo weather interpretation codes
const weatherCodes = {
  0: ["Clear sky", "☀"],
  1: ["Mainly clear", "🌤"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁"],
  45: ["Fog", "🌫"],
  48: ["Rime fog", "🌫"],
  51: ["Light drizzle", "🌦"],
  53: ["Drizzle", "🌦"],
  55: ["Heavy drizzle", "🌧"],
  56: ["Freezing drizzle", "🌧"],
  57: ["Heavy freezing drizzle", "🌧"],
  61: ["Light rain", "🌦"],
  63: ["Rain", "🌧"],
  65: ["Heavy rain", "🌧"],
  66: ["Freezing rain", "🌧"],
  67: ["Heavy freezing rain", "🌧"],
  71: ["Light snow", "🌨"],
  73: ["Snow", "❄"],
  75: ["Heavy snow", "❄"],
  77: ["Snow grains", "❄"],
  80: ["Rain showers", "🌦"],
  81: ["Showers", "🌧"],
  82: ["Heavy showers", "⛈"],
  85: ["Snow showers", "🌨"],
  86: ["Heavy snow showers", "🌨"],
  95: ["Thunderstorm", "⛈"],
  96: ["Thunderstorm with hail", "⛈"],
  99: ["Heavy thunderstorm", "⛈"]
};

function conditionFor(code) {
  return weatherCodes[code] || ["Unknown conditions", "🌤"];
}

function temperature(value) {
  if (value == null || Number.isNaN(value)) return "--";

  return Math.round(
    state.unit === "fahrenheit"
      ? (value * 9 / 5) + 32
      : value
  );
}

function unitSymbol() {
  return state.unit === "celsius" ? "°C" : "°F";
}

function windUnit() {
  return state.unit === "celsius" ? "km/h" : "mph";
}

function convertWind(value) {
  return state.unit === "celsius" ? value : value * 0.621371;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function compass(degrees) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
}

// Loading, error and empty messages
function showStatus(message, type = "loading") {
  els.status.textContent = message;

  els.status.className =
    "mb-5 rounded-xl px-4 py-3 text-sm";

  if (type === "error") {
    els.status.classList.add("bg-rose-50", "text-rose-700");
  } else {
    els.status.classList.add("bg-teal-50", "text-teal-800");
  }

  els.status.hidden = false;
}

function clearStatus() {
  els.status.hidden = true;
  els.status.textContent = "";
}

// Local Storage functions
function saveFavorites() {
  localStorage.setItem(
    "atmos-favorites",
    JSON.stringify(state.favorites)
  );

  renderFavorites();
}

function renderFavorites() {
  els.favoritesList.innerHTML = "";

  if (state.favorites.length === 0) {
    els.favoritesList.innerHTML =
      '<p class="whitespace-nowrap px-2 text-xs text-slate-400">Your saved cities will appear here.</p>';

    updateFavoriteButton();
    return;
  }

  state.favorites.forEach((city) => {
    const button = document.createElement("button");

    button.type = "button";

    button.className =
      "group flex shrink-0 items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 text-left text-xs font-semibold text-slate-600 transition hover:border-teal-100 hover:bg-atmos-pale hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-400 md:w-full";

    button.title = `Show weather for ${city.name}`;

    button.setAttribute(
      "aria-label",
      `Open saved city ${city.name}`
    );

    button.innerHTML =
      `<span>📍 ${city.name}</span><span class="text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-700">→</span>`;

    button.addEventListener("click", () => {
      loadCity(city);
    });

    els.favoritesList.appendChild(button);
  });

  updateFavoriteButton();
}

function updateFavoriteButton() {
  const saved = state.favorites.some((city) =>
    city.name.toLowerCase() === state.city.name.toLowerCase()
  );

  els.favorite.textContent = saved ? "★" : "☆";

  els.favorite.classList.toggle("text-amber-300", saved);
}

function toggleFavorite() {
  const index = state.favorites.findIndex((city) =>
    city.name.toLowerCase() === state.city.name.toLowerCase()
  );

  if (index >= 0) {
    state.favorites.splice(index, 1);
  } else {
    state.favorites.unshift(state.city);
  }

  state.favorites = state.favorites.slice(0, 8);

  saveFavorites();
}

// Search city using Open-Meteo Geocoding API
async function searchCity(query) {
  const url =
    `${GEO_BASE}?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not search for that city. Please try again.");
  }

  const data = await response.json();

  return data.results || [];
}

// Retrieve weather information
async function loadCity(city) {
  state.city = city;

  updateFavoriteButton();

  showStatus(`Loading weather for ${city.name}...`);

  try {
    const params = new URLSearchParams({
      latitude: city.latitude,
      longitude: city.longitude,

      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m",

      hourly:
        "temperature_2m,precipitation_probability,weather_code,visibility",

      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",

      timezone: "auto",
      forecast_days: "7"
    });

    const response = await fetch(`${API_BASE}?${params}`);

    if (!response.ok) {
      throw new Error("Weather service is temporarily unavailable.");
    }

    state.weather = await response.json();

    renderWeather();
    clearStatus();

  } catch (error) {
    showStatus(
      error.message || "Something went wrong while loading weather.",
      "error"
    );
  }
}

// Change the page background and animated effects based on live weather.
function updateWeatherScene(current) {
  const effects = document.querySelector("#weatherEffects");
  const body = document.body;

  const code = current.weather_code;
  const tempC = current.temperature_2m;
  const windKmh = current.wind_speed_10m;

  const rainyCodes = [
    51, 53, 55, 56, 57, 61, 63, 65,
    66, 67, 80, 81, 82, 95, 96, 99
  ];

  const snowyCodes = [71, 73, 75, 77, 85, 86];

  body.classList.remove(
    "weather-sunny",
    "weather-rainy",
    "weather-normal",
    "weather-snowy"
  );

  let scene = "normal";

  if (snowyCodes.includes(code) || tempC <= 5) {
    scene = "snowy";
  } else if (rainyCodes.includes(code)) {
    scene = "rainy";
  } else if ([0, 1].includes(code) && tempC >= 24) {
    scene = "sunny";
  }

  body.classList.add(`weather-${scene}`);

  let sceneHTML = "";

  if (scene === "sunny") {
    sceneHTML = '<div class="weather-sun"></div>';
  }

  else if (scene === "rainy") {
    sceneHTML = `
      <div class="weather-cloud" style="top:9%;left:8%;animation-duration:34s"></div>
      <div class="weather-cloud" style="top:18%;left:58%;opacity:.55;animation-duration:42s"></div>
      <div class="weather-rain"></div>
    `;
  }

  else if (scene === "snowy") {
    sceneHTML = `
      <div class="weather-cloud" style="top:10%;left:14%;opacity:.62"></div>

      <div class="weather-snow">
        <span>❄</span>
        <span>❅</span>
        <span>❄</span>
        <span>❅</span>
        <span>❄</span>
        <span>❅</span>
      </div>
    `;
  }

  else {
    sceneHTML = `
      <div class="weather-cloud" style="top:10%;left:8%;animation-duration:38s"></div>
      <div class="weather-cloud" style="top:23%;left:62%;opacity:.55;animation-duration:48s"></div>
    `;
  }

  if (windKmh >= 25) {
    sceneHTML += `
      <div class="weather-wind">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
  }

  effects.innerHTML = sceneHTML;
}

// Display current weather and highlights
function renderWeather() {
  const data = state.weather;

  if (!data || !data.current) {
    showStatus("No weather data is available for this location.", "error");
    return;
  }

  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;

  const [condition, icon] = conditionFor(current.weather_code);
  const date = new Date(current.time);

  updateWeatherScene(current);

  els.cityName.textContent =
    `${state.city.name}${state.city.country ? ", " + state.city.country : ""}`;

  els.currentDate.textContent = date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  els.currentTemp.innerHTML =
    `${temperature(current.temperature_2m)}<span class="text-3xl">°</span>`;

  els.conditionText.textContent = condition;

  els.feelsLike.textContent =
    `Feels like ${temperature(current.apparent_temperature)}${unitSymbol()}`;

  els.illustration.textContent = icon;

  els.wind.textContent =
    `${Math.round(convertWind(current.wind_speed_10m))} ${windUnit()}`;

  els.humidity.textContent = `${current.relative_humidity_2m}%`;

  els.rain.textContent = `${current.precipitation ?? 0} mm`;

  const uv = daily.uv_index_max?.[0] ?? 0;

  els.uv.textContent = uv.toFixed(1);

  els.uvDescription.textContent =
    uv < 3 ? "Low exposure" :
    uv < 6 ? "Moderate exposure" :
    uv < 8 ? "High exposure" :
    "Very high exposure";

  els.uvBar.style.width = `${Math.min(100, uv / 11 * 100)}%`;

  els.windDirection.textContent =
    `${current.wind_direction_10m}°`;

  els.windDirectionText.textContent =
    `${compass(current.wind_direction_10m)} direction`;

  const currentHourIndex = hourly.time.findIndex(
    (time) => time >= current.time
  );

  const visibilityIndex = currentHourIndex >= 0 ? currentHourIndex : 0;
  const visibility = hourly.visibility?.[visibilityIndex];

  els.visibility.textContent =
    visibility == null
      ? "--"
      : `${(visibility / 1000).toFixed(1)} km`;

  els.sunrise.textContent =
    daily.sunrise?.[0] ? formatTime(daily.sunrise[0]) : "--";

  els.sunset.textContent =
    daily.sunset?.[0]
      ? `Sunset ${formatTime(daily.sunset[0])}`
      : "Sunset --";

  renderHourly(hourly, current.time);
  renderDaily(daily);
  updateFavoriteButton();
}

// Dynamically create hourly forecast cards
function renderHourly(hourly, currentTime) {
  els.hourly.innerHTML = "";

  const startIndex = Math.max(
    0,
    hourly.time.findIndex((time) => time >= currentTime)
  );

  const nextHours = hourly.time
    .slice(startIndex, startIndex + 24)
    .filter((_, index) => index % 3 === 0);

  nextHours.forEach((time) => {
    const index = hourly.time.indexOf(time);
    const [label, icon] = conditionFor(hourly.weather_code[index]);

    const item = document.createElement("div");

    item.className =
      "rounded-xl bg-slate-50 px-2 py-3 text-center first:bg-atmos-pale";

    item.innerHTML = `
      <span class="block text-[10px] text-slate-500">
        ${index === startIndex ? "Now" : formatTime(time)}
      </span>

      <span class="my-2 block text-xl" title="${label}">
        ${icon}
      </span>

      <span class="block text-sm font-bold text-slate-800">
        ${temperature(hourly.temperature_2m[index])}°
      </span>

      <span class="mt-1 block text-[9px] text-slate-400">
        💧 ${hourly.precipitation_probability[index] ?? 0}%
      </span>
    `;

    els.hourly.appendChild(item);
  });

  if (nextHours.length === 0) {
    els.hourly.textContent = "Hourly forecast is unavailable.";
  }
}

// Dynamically create daily forecast rows
function renderDaily(daily) {
  els.daily.innerHTML = "";

  const dayNames = daily.time.map((date, index) => {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";

    return new Date(date).toLocaleDateString([], {
      weekday: "long"
    });
  });

  dayNames.forEach((day, index) => {
    const [condition, icon] =
      conditionFor(daily.weather_code[index]);

    const row = document.createElement("div");

    row.className =
      "grid grid-cols-[1fr_1.2fr_.6fr_.7fr] items-center gap-2 py-3 text-[10px] sm:text-xs";

    row.innerHTML = `
      <span class="font-semibold text-slate-700">${day}</span>

      <span class="flex items-center gap-2 text-slate-500">
        <span class="text-base">${icon}</span>
        <span>${condition}</span>
      </span>

      <span class="text-slate-400">
        💧 ${daily.precipitation_probability_max[index] ?? 0}%
      </span>

      <span class="text-right font-bold text-slate-700">
        ${temperature(daily.temperature_2m_max[index])}°
        <span class="ml-1 font-medium text-slate-400">
          ${temperature(daily.temperature_2m_min[index])}°
        </span>
      </span>
    `;

    els.daily.appendChild(row);
  });
}

// Temperature unit button
function updateUnitButton() {
  els.unitToggle.textContent =
    state.unit === "celsius" ? "°C / °F" : "°F / °C";
}

// Event listener: search form
els.searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = els.cityInput.value.trim();

  if (!query) {
    showStatus("Please enter a city name to search.", "error");
    return;
  }

  showStatus(`Searching for ${query}...`);

  try {
    const results = await searchCity(query);

    if (results.length === 0) {
      showStatus(
        `No cities found for "${query}". Check the spelling and try again.`,
        "error"
      );
      return;
    }

    const city = results[0];

    await loadCity({
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude
    });

    els.cityInput.value = "";

  } catch (error) {
    showStatus(error.message || "Unable to search right now.", "error");
  }
});

// Event listener: save or remove favorite city
els.favorite.addEventListener("click", toggleFavorite);

// Event listener: switch Celsius and Fahrenheit
els.unitToggle.addEventListener("click", () => {
  state.unit =
    state.unit === "celsius" ? "fahrenheit" : "celsius";

  localStorage.setItem("atmos-unit", state.unit);

  updateUnitButton();

  if (state.weather) {
    renderWeather();
  }
});

// Event listener: clear all favorite cities
$("#clearFavorites").addEventListener("click", () => {
  state.favorites = [];
  saveFavorites();
});

// Initial application setup
$("#todayLabel").textContent =
  new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).toUpperCase();

updateUnitButton();
renderFavorites();
loadCity(state.city);
