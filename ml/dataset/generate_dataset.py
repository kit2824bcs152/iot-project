import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_synthetic_weather_dataset(n_samples=5000, output_file='ml/dataset/weather_data.csv'):
    np.random.seed(42)
    start_time = datetime(2026, 1, 1, 0, 0, 0)
    
    timestamps = [start_time + timedelta(hours=i) for i in range(n_samples)]
    
    # Diurnal solar cycle
    hours = np.array([t.hour for t in timestamps])
    day_of_year = np.array([t.timetuple().tm_yday for t in timestamps])
    
    # 1. Temperature: seasonal swing + strong diurnal peak around 14:00 (2 PM)
    diurnal_temp = 7.0 * np.sin((hours - 8) * (2 * np.pi / 24))
    seasonal_temp = 5.0 * np.sin((day_of_year - 80) * (2 * np.pi / 365))
    temp_noise = np.random.normal(0, 0.8, n_samples)
    temperature = 28.0 + diurnal_temp + seasonal_temp + temp_noise
    
    # 2. Humidity: general inverse relationship with temperature
    base_humidity = 70.0 - (temperature - 28.0) * 1.8
    hum_noise = np.random.normal(0, 3.0, n_samples)
    humidity = np.clip(base_humidity + hum_noise, 25.0, 98.0)
    
    # 3. Barometric Pressure: baseline ~1013 hPa with synoptic wave variations
    pressure_wave = 6.0 * np.sin(np.linspace(0, 40 * np.pi, n_samples))
    pressure_noise = np.random.normal(0, 1.2, n_samples)
    pressure = np.clip(1013.25 + pressure_wave + pressure_noise, 975.0, 1038.0)
    
    # 4. Wind Speed: higher in afternoon, gusty
    wind_diurnal = 3.0 * np.sin((hours - 11) * (2 * np.pi / 24))
    wind_base = 12.0 + np.maximum(0, wind_diurnal) + np.random.exponential(4.0, n_samples)
    wind_speed = np.clip(wind_base, 2.0, 58.0)
    
    # 5. Solar / Light Intensity (Lux): 0 at night (19:00 - 05:00), peaks at 12:00
    solar_curve = np.maximum(0, np.sin((hours - 6) * (np.pi / 12)))
    cloud_cover = np.random.uniform(0.6, 1.0, n_samples)
    light_intensity = solar_curve * 1000.0 * cloud_cover + np.random.uniform(0, 20, n_samples)
    light_intensity = np.where((hours < 6) | (hours > 18), np.random.uniform(5, 30, n_samples), light_intensity)
    
    # 6. Rainfall: occasional storms correlated with low pressure & high humidity
    storm_probability = np.where((pressure < 1005) & (humidity > 80), 0.35, 0.04)
    is_raining = np.random.binomial(1, storm_probability, n_samples)
    rainfall = is_raining * np.random.gamma(2.5, 6.0, size=n_samples)
    rainfall = np.clip(rainfall, 0.0, 75.0)
    
    # 7. AQI: spikes during low wind and morning/evening commute, decreases during rain
    commute_spike = 25.0 * (np.exp(-((hours - 8.5) ** 2) / 4) + np.exp(-((hours - 18.5) ** 2) / 4))
    wind_cleanse = -0.5 * wind_speed
    rain_washout = -0.8 * rainfall
    aqi_noise = np.random.normal(0, 6.0, n_samples)
    aqi = np.clip(60.0 + commute_spike + wind_cleanse + rain_washout + aqi_noise, 20.0, 280.0)
    
    # Targets: 1-hour ahead (shifted by 1 step)
    future_temp = np.roll(temperature, -1)
    future_hum = np.roll(humidity, -1)
    future_pres = np.roll(pressure, -1)
    future_aqi = np.roll(aqi, -1)
    
    df = pd.DataFrame({
        'timestamp': [t.strftime('%Y-%m-%d %H:%M:%S') for t in timestamps],
        'temperature': np.round(temperature, 2),
        'humidity': np.round(humidity, 2),
        'pressure': np.round(pressure, 2),
        'aqi': np.round(aqi, 1),
        'rainfall': np.round(rainfall, 2),
        'windSpeed': np.round(wind_speed, 2),
        'lightIntensity': np.round(light_intensity, 1),
        'future_temperature': np.round(future_temp, 2),
        'future_humidity': np.round(future_hum, 2),
        'future_pressure': np.round(future_pres, 2),
        'future_aqi': np.round(future_aqi, 1),
    })
    
    # Drop last row since roll wrapped around
    df = df.iloc[:-1]
    df.to_csv(output_file, index=False)
    print(f"Generated {len(df)} records in {output_file}")
    return df

if __name__ == '__main__':
    generate_synthetic_weather_dataset()
