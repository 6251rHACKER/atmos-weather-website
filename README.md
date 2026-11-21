
# Atmos — Tailwind Weather Dashboard

A responsive, API-driven weather website built with HTML, Tailwind CSS, and vanilla JavaScript for the MP3–MP4 mini project.

## Project files

- `index.html` — webpage structure and Tailwind CSS styling.
- `script.js` — API requests, DOM manipulation, event handling, and Local Storage.

There is no separate CSS file. Tailwind CSS is loaded through its CDN in `index.html`.

## How to run

1. Open the `weather_dashboard` folder in Visual Studio Code.
2. Make sure the folder contains `index.html` and `script.js`.
3. Install the Live Server extension if needed.
4. Right-click `index.html` and select **Open with Live Server**.
5. Keep an internet connection active because Tailwind and the weather APIs load online.

You can also open `index.html` directly in a browser.

## Features

- Search for cities.
- Current temperature and weather conditions.
- Feels-like temperature, wind speed, humidity, and precipitation.
- UV index, wind direction, visibility, sunrise, and sunset.
- Hourly weather forecast.
- 7-day weather forecast.
- Celsius and Fahrenheit switch.
- Save and remove favorite cities.
- Favorite cities and temperature unit persist after refreshing using Local Storage.
- Click any saved city in the sidebar to load its weather again.
- The page background changes with the current weather: sunny yellow, rainy grey-blue, normal blue sky with drifting clouds, or snowy pale blue.
- Animated wind streaks appear when wind speed reaches 25 km/h or higher; snowfall appears during snow or very cold conditions.
- Loading, error, and empty-search messages.
- Responsive desktop and mobile layout.

## APIs

Geocoding API:
https://geocoding-api.open-meteo.com/v1/search

Weather forecast API:
https://api.open-meteo.com/v1/forecast

Weather data is provided by [Open-Meteo](https://open-meteo.com/).

## Assignment requirements

| Requirement | Implementation |
|---|---|
| DOM manipulation and dynamic rendering | JavaScript uses DOM selectors, `createElement()`, and `innerHTML` to display API data. |
| Event handling and JavaScript logic | `addEventListener()` handles search, favorites, clearing favorites, and temperature switching. |
| Arrays and objects | Application state, city objects, weather codes, and forecast arrays are used. |
| Array methods | `map()`, `filter()`, `forEach()`, `find()`, and `findIndex()` are used. |
| API integration | `fetch()` retrieves city search results and weather information. |
| Asynchronous operations | `async` and `await` are used for API requests. |
| Loading, error, and empty states | Status messages are shown during requests and when errors or empty results occur. |
| Local Storage | Favorite cities and the selected temperature unit are stored and restored using `localStorage`. |

## Submission

Submit the project folder or ZIP file and your GitHub repository URL as required by the assignment.
