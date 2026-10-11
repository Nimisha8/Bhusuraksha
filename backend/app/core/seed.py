import asyncio
from sqlalchemy import select
from backend.app.core.database import AsyncSessionLocal, init_db
from backend.app.models.risk_zone import RiskZone
from backend.app.models.sensor import SensorStation
from backend.app.services.gis_service import gis_service
from backend.app.services.sensor_service import sensor_service

async def seed_database():
    await init_db()
    async with AsyncSessionLocal() as session:
        # Check if zones already seeded
        result = await session.execute(select(RiskZone))
        existing_zones = result.scalars().all()
        
        if not existing_zones:
            print("[Seed] Populating initial Risk Zones from GIS dataset...")
            fc = gis_service.get_risk_polygons_geojson()
            for feat in fc.features:
                props = feat.properties
                zone = RiskZone(
                    zone_code=props.get("zone_code", "UNKNOWN"),
                    name=props.get("name", "Vulnerable Slope"),
                    state=props.get("state", "NER"),
                    district=props.get("district", "NER District"),
                    corridor_name=props.get("corridor_name"),
                    latitude=(feat.geometry["coordinates"][0][0][1] + feat.geometry["coordinates"][0][2][1]) / 2.0,
                    longitude=(feat.geometry["coordinates"][0][0][0] + feat.geometry["coordinates"][0][2][0]) / 2.0,
                    slope_degrees=props.get("slope_degrees", 35.0),
                    aspect=props.get("aspect", "SE"),
                    soil_type=props.get("soil_type", "Phyllite Schist"),
                    twi=props.get("twi", 7.5),
                    road_criticality=props.get("road_criticality", 5),
                    population_exposure=props.get("population_exposure", 4),
                    baseline_hazard_score=props.get("baseline_hazard_score", 50.0),
                    current_hazard_score=props.get("current_hazard_score", 50.0),
                    risk_tier=props.get("risk_tier", "MODERATE")
                )
                session.add(zone)
            await session.commit()
            print("[Seed] Risk zones seeded successfully.")

        # Check if sensors already seeded
        res_sen = await session.execute(select(SensorStation))
        existing_sensors = res_sen.scalars().all()
        
        if not existing_sensors:
            print("[Seed] Populating in-situ IoT telemetry stations...")
            for st in sensor_service.list_stations():
                station = SensorStation(
                    id=st.id,
                    name=st.name,
                    zone_code=st.zone_code,
                    latitude=st.latitude,
                    longitude=st.longitude,
                    elevation_m=st.elevation_m,
                    sensor_types=st.sensor_types,
                    status=st.status,
                    battery_level_pct=st.battery_level_pct,
                    last_heartbeat=st.last_heartbeat
                )
                session.add(station)
            await session.commit()
            print("[Seed] Sensor stations seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_database())
