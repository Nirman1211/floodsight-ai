from typing import Dict, Any, List
from shapely.geometry import LineString, Polygon, shape, mapping

class InfrastructureImpactAnalyzer:
    """
    Performs spatial overlay analysis between flood/debris polygons
    and pre-event infrastructure (roads, bridges, buildings).
    """
    
    @staticmethod
    def analyze_exposure(
        flood_geojson: Dict[str, Any],
        osm_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates geometric intersections between flood polygons and OSM elements.
        """
        # Convert flood features to shapely geometries
        flood_polys = []
        for feat in flood_geojson.get("features", []):
            try:
                g = shape(feat["geometry"])
                if g.is_valid and not g.is_empty:
                    flood_polys.append(g)
            except Exception:
                continue
                
        exposed_roads = []
        total_road_km = 0.0
        exposed_road_km = 0.0
        exposed_bridges_count = 0
        total_bridges = 0
        
        for road in osm_data.get("roads", []):
            line = LineString(road["coords"])
            road_len = road.get("length_km", 0.0)
            total_road_km += road_len
            if road.get("has_bridge"):
                total_bridges += 1
                
            is_intersecting = False
            intersected_fraction = 0.0
            
            for fpoly in flood_polys:
                if line.intersects(fpoly):
                    is_intersecting = True
                    try:
                        inter_geom = line.intersection(fpoly)
                        if line.length > 0:
                            fraction = inter_geom.length / line.length
                            intersected_fraction = max(intersected_fraction, fraction)
                    except Exception:
                        intersected_fraction = 0.5
                    break
                    
            if is_intersecting:
                affected_len = round(road_len * max(intersected_fraction, 0.35), 2)
                exposed_road_km += affected_len
                if road.get("has_bridge"):
                    exposed_bridges_count += 1
                    
                exposed_roads.append({
                    "type": "Feature",
                    "geometry": mapping(line),
                    "properties": {
                        "road_id": road["id"],
                        "name": road["name"],
                        "status": "Potentially Inundated / Debris Obstructed",
                        "affected_length_km": affected_len,
                        "has_bridge": road.get("has_bridge", False)
                    }
                })

        # Building exposure
        exposed_buildings = []
        total_bldgs = len(osm_data.get("buildings", []))
        
        for bldg in osm_data.get("buildings", []):
            bpoly = Polygon(bldg["coords"])
            for fpoly in flood_polys:
                if bpoly.intersects(fpoly):
                    exposed_buildings.append({
                        "type": "Feature",
                        "geometry": mapping(bpoly),
                        "properties": {
                            "bldg_id": bldg["id"],
                            "settlement_id": bldg["settlement_id"],
                            "exposure_status": "Intersecting Flood/Sediment Extent"
                        }
                    })
                    break

        pct_disrupted = round((exposed_road_km / total_road_km * 100.0) if total_road_km > 0 else 0.0, 1)

        summary = {
            "total_roads_analyzed_km": round(total_road_km, 2),
            "exposed_road_length_km": round(exposed_road_km, 2),
            "percentage_road_disrupted": pct_disrupted,
            "total_bridges": total_bridges,
            "exposed_bridges_count": exposed_bridges_count,
            "total_buildings": total_bldgs,
            "exposed_buildings_count": len(exposed_buildings)
        }

        return {
            "summary": summary,
            "exposed_roads_geojson": {
                "type": "FeatureCollection",
                "features": exposed_roads
            },
            "exposed_buildings_geojson": {
                "type": "FeatureCollection",
                "features": exposed_buildings
            }
        }
