import pytest
from backend.app.services.notification_service import notification_service

def test_generate_multilingual_alert_red():
    alert = notification_service.generate_multilingual_alert(
        zone_code="SKM-NH10-Z1",
        zone_name="32nd Mile / Singtam Slope Sector",
        corridor_name="NH-10 Sevoke-Gangtok",
        district="Pakyong",
        state="Sikkim",
        color_code="RED",
        risk_score=86.5
    )

    assert alert["alert_id"].startswith("ALERT-SKM-NH10-Z1")
    assert alert["color_code"] == "RED"
    assert alert["risk_score"] == 86.5
    
    # Check all 5 language translations are present
    languages = ["en", "hi", "as", "bn", "mzo"]
    for lang in languages:
        assert lang in alert["titles"]
        assert lang in alert["messages"]
        assert len(alert["titles"][lang]) > 0
        assert len(alert["messages"][lang]) > 0

    # Verify SMS payload is compact
    sms = alert["dissemination_channels"]["sms_broadcast"]["text"]
    assert len(sms) <= 160
    assert "Tollfree: 1077" in sms
    
    # Siren should trigger for RED alert
    assert alert["dissemination_channels"]["siren_trigger"] is True

def test_generate_multilingual_alert_yellow():
    alert = notification_service.generate_multilingual_alert(
        zone_code="ML-NH6-Z1",
        zone_name="Umiam Barapani Basin",
        corridor_name="NH-6",
        district="Ri-Bhoi",
        state="Meghalaya",
        color_code="YELLOW",
        risk_score=42.0
    )
    assert alert["color_code"] == "YELLOW"
    assert alert["dissemination_channels"]["siren_trigger"] is False
