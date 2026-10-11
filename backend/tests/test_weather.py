import pytest
from backend.app.services.weather_service import weather_service

@pytest.mark.asyncio
async def test_weather_and_antecedent_calculation():
    # Gangtok, Sikkim coordinates
    lat = 27.3389
    lon = 88.6065
    res = await weather_service.fetch_weather_and_antecedent(lat, lon, "Gangtok")
    
    assert res.latitude == lat
    assert res.longitude == lon
    assert res.antecedent_indices is not None
    assert res.antecedent_indices.rain_24h_mm >= 0.0
    assert res.antecedent_indices.api_7_day >= 0.0
    assert res.antecedent_indices.saturation_state in ["DRY", "NORMAL", "SATURATED", "SUPERSATURATED"]
    assert len(res.hourly_forecast) > 0

def test_fallback_weather_resilience():
    res = weather_service._generate_fallback_weather(25.5788, 91.8933, "Shillong")
    assert res.antecedent_indices.api_7_day > 50.0
    assert res.antecedent_indices.saturation_state == "SATURATED"
    assert len(res.hourly_forecast) == 12
