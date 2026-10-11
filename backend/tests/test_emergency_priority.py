import pytest
from backend.app.services.priority_service import priority_service

@pytest.mark.asyncio
async def test_corridor_priority_calculation():
    priorities = await priority_service.calculate_corridor_priorities()
    assert len(priorities) >= 3
    
    # Verify sorted strictly in descending order
    scores = [p["priority_score"] for p in priorities]
    assert scores == sorted(scores, reverse=True)

    # Check top prioritized item structure
    top_item = priorities[0]
    assert "priority_score" in top_item
    assert "priority_tier" in top_item
    assert "action_protocol" in top_item
    assert len(top_item["action_protocol"]) >= 1
    assert "resource_package" in top_item
    assert "heavy_machinery" in top_item["resource_package"]
    assert top_item["priority_tier"] in [
        "TIER_1_CRITICAL", "TIER_2_HIGH", "TIER_3_MODERATE", "TIER_4_LOW"
    ]

def test_safe_detour_routing_gangtok():
    detour = priority_service.calculate_safe_detour("Gangtok", "Siliguri")
    assert "primary_route" in detour
    assert "alternative_route" in detour
    assert "Pakyong" in detour["alternative_route"]["route_name"] or "Lava" in detour["alternative_route"]["route_name"]
    assert detour["alternative_route"]["distance_km"] > detour["primary_route"]["distance_km"]
    assert "recommendation_summary" in detour

def test_safe_detour_routing_shillong():
    detour = priority_service.calculate_safe_detour("Shillong", "Guwahati")
    assert "NH-6" in detour["primary_route"]["route_name"]
    assert detour["rerouting_active"] is False
