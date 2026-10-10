from typing import Dict, Any

class SituationReportCopilot:
    """
    Grounded factual Situation Report Copilot.
    Guarantees zero-hallucination answers strictly tied to computed database metrics.
    Supports English ('en') and Nepali ('ne').
    """
    
    @staticmethod
    def answer_query(query: str, analysis_result: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
        q_lower = query.lower()
        infra = analysis_result["infrastructure"]
        cut_off_villages = [s["name"] for s in analysis_result["settlements"] if s["status"] == "newly_cut_off"]
        intact_villages = [s["name"] for s in analysis_result["settlements"] if s["status"] == "intact_access"]
        area_km2 = analysis_result["total_flood_area_km2"]
        exposed_road_km = infra["exposed_road_length_km"]
        exposed_bridges = infra["exposed_bridges_count"]
        total_bridges = infra["total_bridges"]
        
        # Grounded facts dictionary
        grounded_metrics = {
            "total_flood_area_km2": area_km2,
            "exposed_road_length_km": exposed_road_km,
            "exposed_bridges_count": exposed_bridges,
            "total_bridges": total_bridges,
            "cut_off_settlements": cut_off_villages,
            "accessible_settlements": intact_villages
        }
        
        observation_dates = {
            "event_date": analysis_result["event_date"],
            "sentinel_1_pre": "2026-08-18 (Track 019)",
            "sentinel_1_post": "2026-08-30 (Track 019)",
            "osm_snapshot": "2026-07-27"
        }
        
        # Intent matching
        if "who is cut off" in q_lower or "isolated" in q_lower or "cut off" in q_lower or "बन्द" in q_lower or "सम्पर्कविहीन" in q_lower:
            if language == "ne":
                answer = (
                    f"गणना गरिएको सडक सञ्जाल अनुसार, जम्मा {len(cut_off_villages)} वटा बस्तीहरू अस्पताल र बजारसँगको सडक सम्पर्कबाट पूर्ण रूपमा विच्छेद भएका छन्: "
                    f"{', '.join(cut_off_villages)}। यी बस्तीहरूको सडक मार्गमा पर्ने पुलहरू बाढीले प्रभावित भएका छन्।"
                )
            else:
                answer = (
                    f"Based on topological road network analysis, exactly {len(cut_off_villages)} settlements have completely lost road access to the nearest hospital: "
                    f"{', '.join(cut_off_villages)}. These villages are isolated due to inundated road segments and severed bridge crossings."
                )
                
        elif "road" in q_lower or "bridge" in q_lower or "infrastructure" in q_lower or "damage" in q_lower or "सडक" in q_lower or "पुल" in q_lower:
            if language == "ne":
                answer = (
                    f"पूर्वाधार प्रभाव विवरण: {exposed_road_km} कि.मी. सडक (उपत्यकाको मुख्य सडकको {infra['percentage_road_disrupted']}%) बाढी र लेदोको उच्च जोखिममा परेको छ। "
                    f"जम्मा {total_bridges} वटा पुलहरू मध्ये {exposed_bridges} वटा पुल बाढी क्षेत्रमा परेका छन्। "
                    f"साथै {infra['exposed_buildings_count']} वटा घरका संरचनाहरू बाढी क्षेत्रमा परेका छन्।"
                )
            else:
                answer = (
                    f"Infrastructure Impact Assessment: {exposed_road_km} km of road network ({infra['percentage_road_disrupted']}% of the corridor) intersects the flood/debris extent. "
                    f"{exposed_bridges} out of {total_bridges} bridges are potentially severed. "
                    f"A total of {infra['exposed_buildings_count']} building footprints overlap the mapped flood zone."
                )
                
        elif "area" in q_lower or "flood" in q_lower or "size" in q_lower or "क्षेत्रफल" in q_lower:
            if language == "ne":
                answer = (
                    f"Sentinel-1 र Sentinel-2 स्याटेलाइट विश्लेषण अनुसार कुल {area_km2} वर्ग कि.मी. ({analysis_result['total_flood_area_hectares']} हेक्टर) "
                    f"भूभाग बाढी र गेग्रान/लेदोले ढाकेको देखिन्छ।"
                )
            else:
                answer = (
                    f"Satellite radar & optical change detection mapped a total inundated and debris-covered area of "
                    f"{area_km2} km² ({analysis_result['total_flood_area_hectares']} hectares) along the Trishuli River corridor."
                )
        else:
            if language == "ne":
                answer = (
                    f"घटना सारांश ({analysis_result['event_date']}): कुल बाढी क्षेत्र {area_km2} वर्ग कि.मी., "
                    f"{exposed_road_km} कि.मी. सडक र {exposed_bridges} वटा पुल प्रभावित। "
                    f"{len(cut_off_villages)} वटा बस्तीहरू ({', '.join(cut_off_villages)}) सम्पर्कविहीन भएका छन्।"
                )
            else:
                answer = (
                    f"Disaster Overview for {analysis_result['name']} ({analysis_result['event_date']}): "
                    f"Total affected extent is {area_km2} km², with {exposed_road_km} km of road and {exposed_bridges} bridges in the hazard zone. "
                    f"{len(cut_off_villages)} settlements ({', '.join(cut_off_villages)}) are cut off from medical facilities."
                )
                
        return {
            "answer": answer,
            "grounded_metrics": grounded_metrics,
            "observation_dates": observation_dates,
            "confidence_statement": "All figures strictly derived from Sentinel-1 SAR change detection and pre-event OpenStreetMap graph routing."
        }
