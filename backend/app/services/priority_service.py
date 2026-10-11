import math
from typing import List, Dict, Any, Optional
from backend.app.services.gis_service import gis_service
from backend.app.services.ml_service import ml_service
from backend.app.services.weather_service import weather_service

class EmergencyPriorityService:
    def __init__(self):
        # Normalized weighting coefficients for MCDA
        self.w_hazard = 1.0
        self.w_road = 0.35
        self.w_pop = 0.35
        self.w_infra = 0.30
        self.alpha_trend = 0.15

    async def calculate_corridor_priorities(self) -> List[Dict[str, Any]]:
        """
        Calculates Emergency Priority Scores across all registered pilot corridors and zones in NER.
        Ranks them in descending order of emergency urgency.
        """
        zone_predictions = await ml_service.predict_for_all_zones()
        roads = gis_service.get_road_segments()
        
        prioritized_items = []

        for zp in zone_predictions:
            zone_code = zp["zone_code"]
            hazard_prob = zp["risk_score_100"] / 100.0 # 0.0 to 1.0
            
            # Find associated road segment
            matching_road = None
            for r in roads:
                if r.state in zp.get("state", "") or r.road_code in zp.get("corridor_name", ""):
                    matching_road = r
                    break
            
            road_crit = matching_road.criticality_tier if matching_road else 3 # 1 to 5
            is_road_blocked = matching_road.status == "BLOCKED" if matching_road else False
            
            # Population exposure index (1 to 5)
            pop_exposure = 4 if "Gangtok" in zp["name"] or "Shillong" in zp["name"] or "Kohima" in zp["name"] else 3
            infra_exposure = 4 if matching_road and matching_road.criticality_tier == 5 else 2

            # Rainfall rate of change delta trend (mm/hr acceleration over 6 hours)
            # Simulated based on weather forecast
            delta_rain_trend = 1.8 if zp["risk_score_100"] > 60.0 else 0.4

            # MCDA Priority Score Formula:
            # Score = (w_h * P_hazard) * (w_r * C_road + w_p * D_pop + w_i * I_infra) * (1 + alpha * delta_R)
            consequence_factor = (
                self.w_road * road_crit +
                self.w_pop * pop_exposure +
                self.w_infra * infra_exposure
            ) # Range ~ 1.0 to 5.0
            
            # Base priority score scaled 0 - 100
            trend_multiplier = 1.0 + (self.alpha_trend * min(5.0, delta_rain_trend))
            raw_priority = (hazard_prob * consequence_factor * 20.0) * trend_multiplier
            
            # Boost if road is physically blocked or has active slide report
            if is_road_blocked:
                raw_priority = max(raw_priority, 88.0)

            priority_score = min(100.0, round(raw_priority, 1))

            # Operational Action Tier
            if priority_score >= 80.0:
                tier = "TIER_1_CRITICAL"
                tier_name = "Tier 1: Immediate Emergency Intervention"
                color = "RED"
                action_protocol = [
                    "Immediate NDRF / SDRF troop prepositioning at sector headquarters.",
                    "Close arterial highway to civilian traffic and activate traffic diversion.",
                    "Trigger automated evacuation warnings to downslope village settlements.",
                    "Place Border Roads Organisation (BRO) / NHIDCL bulldozers on hot standby."
                ]
                resource_package = {
                    "heavy_machinery": "2x Excavators, 1x Wheel Loader",
                    "personnel": "1x NDRF Rescue Platoon (35 personnel), 1x Medical Unit",
                    "evacuation_status": "MANDATORY_EVACUATION"
                }
            elif priority_score >= 50.0:
                tier = "TIER_2_HIGH"
                tier_name = "Tier 2: High Alert & Pre-Deployment"
                color = "ORANGE"
                action_protocol = [
                    "Issue district administration travel advisory.",
                    "Deploy two-man slope inspection patrol teams along cut slopes.",
                    "Restrict loaded heavy commercial vehicles from vulnerable bridges.",
                    "Verify satellite and in-situ piezometer telemetry hourly."
                ]
                resource_package = {
                    "heavy_machinery": "1x JCB on standby within 10km",
                    "personnel": "Local Traffic Police + Quick Response Team",
                    "evacuation_status": "ADVISORY_WATCH"
                }
            elif priority_score >= 25.0:
                tier = "TIER_3_MODERATE"
                tier_name = "Tier 3: Elevated Vigilance"
                color = "YELLOW"
                action_protocol = [
                    "Continuous automated hydro-meteorological surveillance.",
                    "Issue public weather advisory on highway electronic signboards.",
                    "Monitor antecedent rainfall accumulation curve."
                ]
                resource_package = {
                    "heavy_machinery": "Standard depot standby",
                    "personnel": "Routine highway patrol",
                    "evacuation_status": "NORMAL"
                }
            else:
                tier = "TIER_4_LOW"
                tier_name = "Tier 4: Routine Baseline"
                color = "GREEN"
                action_protocol = [
                    "Standard environmental monitoring."
                ]
                resource_package = {
                    "heavy_machinery": "None required",
                    "personnel": "Standard",
                    "evacuation_status": "NORMAL"
                }

            prioritized_items.append({
                "zone_code": zone_code,
                "name": zp["name"],
                "state": zp["state"],
                "corridor_name": zp.get("corridor_name"),
                "priority_score": priority_score,
                "priority_tier": tier,
                "tier_name": tier_name,
                "color_code": color,
                "hazard_probability": hazard_prob,
                "road_criticality": road_crit,
                "is_road_blocked": is_road_blocked,
                "population_exposure": pop_exposure,
                "weather_acceleration": round(delta_rain_trend, 2),
                "action_protocol": action_protocol,
                "resource_package": resource_package
            })

        # Sort strictly descending by Priority Score
        prioritized_items.sort(key=lambda x: x["priority_score"], reverse=True)
        return prioritized_items

    def calculate_safe_detour(
        self, 
        origin_name: str, 
        destination_name: str
    ) -> Dict[str, Any]:
        """
        Evaluates bypass and evacuation routes when arterial corridors in NER are severed.
        For example: Gangtok to Siliguri via NH-10 vs alternate via Lava-Algarah-Gorubathan.
        """
        roads = gis_service.get_road_segments()
        nh10_blocked = any(r.road_code == "NH-10" and r.status in ["BLOCKED", "RESTRICTED"] for r in roads)
        
        if "Gangtok" in origin_name or "Sikkim" in origin_name:
            primary_route = {
                "route_name": "NH-10 Lifeline Corridor (Gangtok - Singtam - Teesta - Sevoke)",
                "distance_km": 114.0,
                "estimated_travel_time_hours": 3.8,
                "status": "BLOCKED / HIGH RISK" if nh10_blocked else "OPEN",
                "hazard_exposure": "CRITICAL: Multiple deep cut slopes along Teesta river gorge.",
                "is_recommended": not nh10_blocked
            }
            alternate_detour = {
                "route_name": "Alternative Hill Bypass: Gangtok - Pakyong - Rorathang - Reshi - Lava - Gorubathan - Siliguri",
                "distance_km": 158.0,
                "estimated_travel_time_hours": 5.5,
                "status": "OPEN (Safe Detour)",
                "hazard_exposure": "MODERATE: Gentler ridges, avoids vulnerable Teesta river toe-erosion.",
                "is_recommended": nh10_blocked
            }
            return {
                "corridor": "Sikkim Lifeline (Gangtok - Plain Connectivity)",
                "primary_route": primary_route,
                "alternative_route": alternate_detour,
                "rerouting_active": nh10_blocked,
                "recommendation_summary": (
                    "MANDATORY DETOUR ACTIVE: Divert all ambulances and essential supply convoys via "
                    "Pakyong-Lava-Gorubathan route. NH-10 Teesta gorge is severed or under critical hazard."
                    if nh10_blocked else "NH-10 is currently operational. Monitor rainfall closely."
                )
            }
        else:
            # Default Assam / Meghalaya route
            return {
                "corridor": "Guwahati - Shillong Corridor (NH-6)",
                "primary_route": {
                    "route_name": "NH-6 Four-Lane Expressway (Jorabat - Nongpoh - Umiam - Shillong)",
                    "distance_km": 99.0,
                    "estimated_travel_time_hours": 2.5,
                    "status": "OPEN",
                    "hazard_exposure": "MODERATE: Controlled rock cut slopes with wire mesh protection.",
                    "is_recommended": True
                },
                "alternative_route": {
                    "route_name": "Old Guwahati - Shillong State Highway via Umsning",
                    "distance_km": 112.0,
                    "estimated_travel_time_hours": 3.4,
                    "status": "OPEN",
                    "hazard_exposure": "LOW",
                    "is_recommended": False
                },
                "rerouting_active": False,
                "recommendation_summary": "Primary 4-lane NH-6 corridor is clear. Maintain normal speed limits."
            }

priority_service = EmergencyPriorityService()
