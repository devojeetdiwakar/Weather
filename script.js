const apiKey = "3267c6f2854284cdfbe0e0dcb1c59cdb";
let timeInterval;

// 🌙 Theme Toggle
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  const btn = document.getElementById("toggleThemeBtn");
  document.body.classList.toggle("dark");
  btn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// 🧭 Search button
document.getElementById("getWeatherBtn").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value.trim();
  if (city) getWeather(city);
});

// 🌤️ Emoji for weather condition
function getWeatherEmoji(main) {
  switch (main.toLowerCase()) {
    case "clear": return "☀️";
    case "clouds": return "☁️";
    case "rain": return "🌧️";
    case "drizzle": return "🌦️";
    case "thunderstorm": return "⛈️";
    case "snow": return "❄️";
    case "mist":
    case "fog":
    case "haze":
    case "smoke":
    case "dust": return "🌫️";
    default: return "🌈";
  }
}

// ⏰ Local time updater
function displayLocalTime(offset, containerId) {
  if (timeInterval) clearInterval(timeInterval);
  function updateTime() {
    const utcNow = new Date();
    const local = new Date(utcNow.getTime() + offset * 1000 + utcNow.getTimezoneOffset() * 60000);
    const time = local.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = local.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById(containerId).textContent = `${time} (${date})`;
  }
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
}

// 🌦️ Main weather fetcher
async function getWeather(city) {
  const container = document.getElementById("weatherContainer");
  container.innerHTML = "Loading...";
  container.classList.add("loading");

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`)
    ]);
    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    if (currentData.cod !== 200 || forecastData.cod !== "200") {
      container.innerHTML = `
        <div class="error-box">
          <img src="error.gif" alt="Error" class="error-animation"/>
          <p class="error-text">Oops! City not found. Try again.</p>
        </div>
      `;
      return;
    }

    const { main, weather, wind, visibility, sys, name, timezone } = currentData;
    const currentIcon = weather[0].icon;
    const currentIconUrl = `https://openweathermap.org/img/wn/${currentIcon}@2x.png`;
    const flagUrl = `https://flagcdn.com/32x24/${sys.country.toLowerCase()}.png`;
    const localTimeSpanId = "localTimeDisplay";

    const hourlyHTML = forecastData.list.slice(0, 8).map(hour => {
      const time = new Date(hour.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' });
      const temp = `${Math.round(hour.main.temp)}°C`;
      const icon = `https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`;
      return `<div class="hour-box"><span>${time}</span><img src="${icon}" alt="" /><span>${temp}</span></div>`;
    }).join('');

    const dailyList = forecastData.list.filter(f => f.dt_txt.includes("12:00:00"));
    const dailyHTML = dailyList.map(day => {
      const date = new Date(day.dt * 1000);
      const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
      const temp = `${Math.round(day.main.temp)}°`;
      const icon = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
      return `<div class="day-box"><span>${weekday}</span><img src="${icon}" alt="" /><span>${temp}</span></div>`;
    }).join('');

    const labels = forecastData.list.slice(0, 8).map(hour => {
      return new Date(hour.dt * 1000).toLocaleTimeString([], { hour: 'numeric' });
    });
    const temps = forecastData.list.slice(0, 8).map(hour => hour.main.temp);

    container.classList.remove("loading");
    container.classList.add("show");
    container.innerHTML = `
      <h2>${name}, ${sys.country} <img src="${flagUrl}" alt="flag" />
        <br><span id="${localTimeSpanId}" class="time-label"></span>
      </h2>

      <div class="row">
        <span>Condition</span>
        <span><span style="font-size: 1.5rem;">${getWeatherEmoji(weather[0].main)}</span> ${weather[0].description} <img src="${currentIconUrl}" height="35" /></span>
      </div>
      <div class="row"><span>Temp</span><span>${main.temp.toFixed(1)}°C</span></div>
      <div class="row"><span>Humidity</span><span>${main.humidity}%</span></div>
      <div class="row"><span>Wind</span><span>${wind.speed.toFixed(1)} km/h</span></div>
      <div class="row"><span>Visibility</span><span>${(visibility / 1000).toFixed(1)} km</span></div>

      <h3 style="margin-top: 1rem;">🕐 Hourly Forecast</h3>
      <div class="hourly-scroll">${hourlyHTML}</div>

      <h3 style="margin-top: 1.5rem;">📅 5-Day Forecast</h3>
      <div class="daily-scroll">${dailyHTML}</div>

      <h3 style="margin-top: 1.5rem;">📈 Hourly Temp (°C)</h3>
      <canvas id="tempChart" height="150"></canvas>
    `;

    setTimeout(() => {
      const ctx = document.getElementById("tempChart").getContext("2d");
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Hourly Temp (°C)',
            data: temps,
            borderColor: '#fff',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#fff' } },
            y: { ticks: { color: '#fff' } }
          }
        }
      });
    }, 100);

    displayLocalTime(timezone, localTimeSpanId);
  } catch (err) {
    container.innerHTML = `
      <div class="error-box">
        <img src="error.gif" alt="Error" class="error-animation"/>
        <p class="error-text">Something went wrong. Please check your internet or API.</p>
      </div>
    `;
    console.error(err);
  }
}

// 📍 Auto-load weather for current location
window.addEventListener("load", () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`);
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          getWeather(geoData[0].name);
        }
      } catch (e) {
        console.error("Geolocation failed", e);
      }
    });
  }
});
