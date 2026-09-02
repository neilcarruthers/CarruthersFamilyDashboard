/**
 * Carruthers Family Dashboard - Weather Module
 * Location: Winnipeg, Manitoba, Canada (49.8951° N, 97.1384° W)
 * Provider: Open-Meteo (Free client-side API, CORS enabled, no API key required)
 */

const WeatherModule = {
  LATITUDE: 49.8951,
  LONGITUDE: -97.1384,
  TIMEZONE: 'America/Winnipeg',
  refreshInterval: 1800000, // 30 minutes

  init() {
    this.fetchWeather();
    setInterval(() => this.fetchWeather(), this.refreshInterval);
  },

  async fetchWeather() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.LATITUDE}&longitude=${this.LONGITUDE}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(this.TIMEZONE)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
      const data = await response.json();
      this.renderWeather(data);
      localStorage.setItem('carruthers_weather_cache', JSON.stringify({ timestamp: Date.now(), data }));
    } catch (err) {
      console.warn('Weather fetch failed, checking cache:', err);
      const cached = localStorage.getItem('carruthers_weather_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          this.renderWeather(parsed.data);
          return;
        } catch (e) {}
      }
      this.renderFallback();
    }
  },

  getWeatherMeta(code, isDay = 1) {
    // WMO Weather Interpretation Codes
    const weatherMap = {
      0: { label: isDay ? 'Clear Skies' : 'Clear Night', icon: isDay ? 'sun' : 'moon' },
      1: { label: 'Mainly Clear', icon: isDay ? 'sun-cloud' : 'moon-cloud' },
      2: { label: 'Partly Cloudy', icon: 'partly-cloudy' },
      3: { label: 'Overcast', icon: 'cloud' },
      45: { label: 'Foggy', icon: 'fog' },
      48: { label: 'Depositing Rime Fog', icon: 'fog' },
      51: { label: 'Light Drizzle', icon: 'drizzle' },
      53: { label: 'Moderate Drizzle', icon: 'drizzle' },
      55: { label: 'Dense Drizzle', icon: 'rain' },
      56: { label: 'Light Freezing Drizzle', icon: 'sleet' },
      57: { label: 'Dense Freezing Drizzle', icon: 'sleet' },
      61: { label: 'Slight Rain', icon: 'drizzle' },
      63: { label: 'Moderate Rain', icon: 'rain' },
      65: { label: 'Heavy Rain', icon: 'heavy-rain' },
      66: { label: 'Freezing Rain', icon: 'sleet' },
      67: { label: 'Heavy Freezing Rain', icon: 'sleet' },
      71: { label: 'Slight Snowfall', icon: 'snow' },
      73: { label: 'Moderate Snowfall', icon: 'snow' },
      75: { label: 'Heavy Snowfall', icon: 'snow' },
      77: { label: 'Snow Grains', icon: 'snow' },
      80: { label: 'Slight Rain Showers', icon: 'drizzle' },
      81: { label: 'Moderate Rain Showers', icon: 'rain' },
      82: { label: 'Violent Rain Showers', icon: 'heavy-rain' },
      85: { label: 'Slight Snow Showers', icon: 'snow' },
      86: { label: 'Heavy Snow Showers', icon: 'snow' },
      95: { label: 'Thunderstorm', icon: 'thunder' },
      96: { label: 'Thunderstorm with Hail', icon: 'thunder' },
      99: { label: 'Severe Thunderstorm', icon: 'thunder' }
    };

    return weatherMap[code] || { label: 'Fair Weather', icon: isDay ? 'sun-cloud' : 'moon-cloud' };
  },

  getIconSvg(iconName) {
    switch (iconName) {
      case 'sun':
        return `<svg viewBox="0 0 64 64" fill="none" stroke="#D49B55" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="32" cy="32" r="13" fill="#FDF6EC" />
          <line x1="32" y1="6" x2="32" y2="12" />
          <line x1="32" y1="52" x2="32" y2="58" />
          <line x1="6" y1="32" x2="12" y2="32" />
          <line x1="52" y1="32" x2="58" y2="32" />
          <line x1="13.6" y1="13.6" x2="17.8" y2="17.8" />
          <line x1="46.2" y1="46.2" x2="50.4" y2="50.4" />
          <line x1="13.6" y1="50.4" x2="17.8" y2="46.2" />
          <line x1="46.2" y1="17.8" x2="50.4" y2="13.6" />
        </svg>`;
      case 'moon':
        return `<svg viewBox="0 0 64 64" fill="none" stroke="#7C8C73" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M42 46A20 20 0 1 1 36 8a16 16 0 0 0 6 38z" fill="#EEF3ED"/>
        </svg>`;
      case 'partly-cloudy':
      case 'sun-cloud':
        return `<svg viewBox="0 0 64 64" fill="none" stroke="#7C8C73" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="26" cy="24" r="10" stroke="#D49B55" stroke-width="3" fill="#FDF6EC" />
          <path d="M26 10v4M16 14l3 3M12 24h4" stroke="#D49B55" stroke-width="3" />
          <path d="M22 48h24a12 12 0 0 0 0-24 11 11 0 0 0-11 4 10 10 0 0 0-13 20z" fill="#FFFDF9" />
        </svg>`;
      case 'cloud':
        return `<svg viewBox="0 0 64 64" fill="none" stroke="#7C8C73" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 46h28a12 12 0 0 0 0-24 12 12 0 0 0-14 3 11 11 0 0 0-14 21z" fill="#EEF3ED" />
        </svg>`;
      case 'rain':
      case 'drizzle':
        return `<svg viewBox="0 0 64 64" fill="none" stroke="#7C8C73" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 36h28a12 12 0 0 0 0-24 12 12 0 0 0-14 3 11 11 0 0 0-14 21z" fill="#EEF3ED" />
          <line x1="22" y1="44" x2="20" y2="52" stroke="#C86D51" stroke-width="3.5" />
          <line x1="32" y1="44" x2="30" y2="52" stroke="#C86D51" stroke-width="3.5" />
          <line x1="42" y1="44" x2="40" y2="52" stroke="#C86D51" stroke-width="3.5" />
        </svg>`;
      case 'snow':
        return `<svg viewBox="0 0 64 64" fill="none" stroke="#7C8C73" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 36h28a12 12 0 0 0 0-24 12 12 0 0 0-14 3 11 11 0 0 0-14 21z" fill="#EEF3ED" />
          <circle cx="22" cy="48" r="2" fill="#7C8C73" />
          <circle cx="32" cy="50" r="2.5" fill="#7C8C73" />
          <circle cx="42" cy="48" r="2" fill="#7C8C73" />
        </svg>`;
      case 'thunder':
        return `<svg viewBox="0 0 64 64" fill="none" stroke="#7C8C73" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 34h28a12 12 0 0 0 0-24 12 12 0 0 0-14 3 11 11 0 0 0-14 21z" fill="#EEF3ED" />
          <polygon points="32 38 24 50 31 50 28 60 40 46 33 46 36 38" fill="#D49B55" stroke="#D49B55" stroke-width="2" />
        </svg>`;
      default:
        return `<svg viewBox="0 0 64 64" fill="none" stroke="#7C8C73" stroke-width="3.5" stroke-linecap="round">
          <circle cx="32" cy="32" r="16" fill="#FDF6EC" stroke="#D49B55" />
        </svg>`;
    }
  },

  renderWeather(data) {
    if (!data || !data.current || !data.daily) {
      this.renderFallback();
      return;
    }

    const current = data.current;
    const daily = data.daily;
    const meta = this.getWeatherMeta(current.weather_code, current.is_day);

    // Current Temp & Condition
    const tempMainEl = document.getElementById('weather-temp-main');
    const conditionEl = document.getElementById('weather-condition-label');
    const iconLargeEl = document.getElementById('weather-icon-large');

    if (tempMainEl) tempMainEl.textContent = `${Math.round(current.temperature_2m)}°C`;
    if (conditionEl) conditionEl.textContent = meta.label;
    if (iconLargeEl) iconLargeEl.innerHTML = this.getIconSvg(meta.icon);

    // Metrics
    const feelsLikeEl = document.getElementById('metric-feels-like');
    const windEl = document.getElementById('metric-wind');
    const humidityEl = document.getElementById('metric-humidity');

    if (feelsLikeEl) feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
    if (windEl) windEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    if (humidityEl) humidityEl.textContent = `${Math.round(current.relative_humidity_2m)}%`;

    // 5-Day Forecast Strip
    const forecastListEl = document.getElementById('forecast-days-list');
    if (forecastListEl && daily.time && daily.time.length > 0) {
      forecastListEl.innerHTML = '';
      
      // Render next 5 days
      const daysCount = Math.min(5, daily.time.length);
      for (let i = 0; i < daysCount; i++) {
        const dateStr = daily.time[i];
        // Parse date
        const parts = dateStr.split('-');
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        
        const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-CA', { weekday: 'short' });
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const dayMeta = this.getWeatherMeta(daily.weather_code[i], 1);

        const tile = document.createElement('div');
        tile.className = 'forecast-day-tile';
        tile.innerHTML = `
          <span class="f-day-name">${dayName}</span>
          <div class="f-day-icon">${this.getIconSvg(dayMeta.icon)}</div>
          <span class="f-day-temps">${maxTemp}° <span>${minTemp}°</span></span>
        `;
        forecastListEl.appendChild(tile);
      }
    }
  },

  renderFallback() {
    const tempMainEl = document.getElementById('weather-temp-main');
    const conditionEl = document.getElementById('weather-condition-label');
    const iconLargeEl = document.getElementById('weather-icon-large');

    if (tempMainEl) tempMainEl.textContent = '22°C';
    if (conditionEl) conditionEl.textContent = 'Partly Cloudy';
    if (iconLargeEl) iconLargeEl.innerHTML = this.getIconSvg('partly-cloudy');

    const feelsLikeEl = document.getElementById('metric-feels-like');
    const windEl = document.getElementById('metric-wind');
    const humidityEl = document.getElementById('metric-humidity');

    if (feelsLikeEl) feelsLikeEl.textContent = '23°C';
    if (windEl) windEl.textContent = '12 km/h';
    if (humidityEl) humidityEl.textContent = '65%';
  }
};

window.WeatherModule = WeatherModule;
