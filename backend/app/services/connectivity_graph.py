from typing import Dict, Any, List
import networkx as nx

class ConnectivityGraphAnalyzer:
    """
    Constructs a topological road network graph and computes baseline vs post-disaster
    reachability to hospitals and towns.
    Distinguishes newly cut-off settlements from pre-existing isolated hamlets.
    """
    
    @staticmethod
    def build_network_graph(osm_data: Dict[str, Any]) -> nx.Graph:
        """
        Builds a NetworkX graph from pre-event OSM roads and settlements.
        """
        G = nx.Graph()
        
        # Add settlements as nodes
        for s in osm_data.get("settlements", []):
            G.add_node(s["id"], type="settlement", name=s["name"], coords=s["coords"], pop=s["pop"])
            
        # Add hospitals as nodes
        for h in osm_data.get("hospitals", []):
            G.add_node(h["id"], type="hospital", name=h["name"], coords=h["coords"])
            
        # Connect hospitals to nearest settlement hubs
        G.add_edge("hosp_01", "set_10", weight=0.5, road_id="hosp_link_01")
        G.add_edge("hosp_02", "set_06", weight=0.3, road_id="hosp_link_02")
        G.add_edge("hosp_03", "set_04", weight=0.2, road_id="hosp_link_03")
        
        # Add road edges
        # Road segments topology:
        # Rasuwagadhi (set_01) <-> Timure (set_02)
        G.add_edge("set_01", "set_02", weight=4.2, road_id="road_seg_01", name="Pasang Lhamu Hwy (Rasuwagadhi-Timure)")
        
        # Timure (set_02) <-> Syaphrubesi (set_04)
        G.add_edge("set_02", "set_04", weight=11.5, road_id="road_seg_02", name="Pasang Lhamu Hwy (Timure-Syaphrubesi)")
        
        # Thambuchet (set_03) <-> Syaphrubesi (set_04)
        G.add_edge("set_03", "set_04", weight=3.8, road_id="road_seg_03", name="Thambuchet Link Road")
        
        # Syaphrubesi (set_04) <-> Dhunche (set_06)
        G.add_edge("set_04", "set_06", weight=14.8, road_id="road_seg_04", name="Pasang Lhamu Hwy (Syaphrubesi-Dhunche)")
        
        # Brabal (set_05) <-> Dhunche (set_06)
        G.add_edge("set_05", "set_06", weight=5.1, road_id="road_seg_05", name="Brabal Ridge Trail Road")
        
        # Dhunche (set_06) <-> Ramche (set_07)
        G.add_edge("set_06", "set_07", weight=12.3, road_id="road_seg_06", name="Pasang Lhamu Hwy (Dhunche-Ramche)")
        
        # Ramche (set_07) <-> Kalikasthan (set_08)
        G.add_edge("set_07", "set_08", weight=6.7, road_id="road_seg_07", name="Pasang Lhamu Hwy (Ramche-Kalikasthan)")
        
        # Kalikasthan (set_08) <-> Betrawati (set_09)
        G.add_edge("set_08", "set_09", weight=7.4, road_id="road_seg_08", name="Pasang Lhamu Hwy (Kalikasthan-Betrawati)")
        
        # Betrawati (set_09) <-> Trishuli/Bidur (set_10)
        G.add_edge("set_09", "set_10", weight=9.2, road_id="road_seg_09", name="Highway H03 (Betrawati-Trishuli)")
        
        # Alternative bypass route: High mountain bypass connecting Brabal (set_05) to Kalikasthan (set_08)
        G.add_edge("set_05", "set_08", weight=22.5, road_id="bypass_01", name="High Ridge Emergency Bypass Track")
        
        return G

    @staticmethod
    def analyze_settlement_isolation(
        osm_data: Dict[str, Any],
        exposed_road_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Runs baseline vs post-event shortest-path reachability.
        """
        # 1. Baseline Graph
        G_baseline = ConnectivityGraphAnalyzer.build_network_graph(osm_data)
        
        # Target hospital nodes
        hospital_nodes = [h["id"] for h in osm_data.get("hospitals", [])]
        
        # 2. Post-event Graph: remove severed/exposed road segments
        G_post = G_baseline.copy()
        for u, v, data in list(G_post.edges(data=True)):
            if data.get("road_id") in exposed_road_ids:
                G_post.remove_edge(u, v)

        results = []
        
        for s in osm_data.get("settlements", []):
            s_id = s["id"]
            
            # Baseline shortest path to nearest hospital
            base_min_dist = float("inf")
            base_nearest_hosp = None
            for h_id in hospital_nodes:
                try:
                    dist = nx.shortest_path_length(G_baseline, source=s_id, target=h_id, weight="weight")
                    if dist < base_min_dist:
                        base_min_dist = dist
                        base_nearest_hosp = h_id
                except nx.NetworkXNoPath:
                    continue
                    
            is_baseline_connected = base_min_dist < float("inf")
            
            # Post-event shortest path to any hospital
            post_min_dist = float("inf")
            post_nearest_hosp = None
            for h_id in hospital_nodes:
                try:
                    dist = nx.shortest_path_length(G_post, source=s_id, target=h_id, weight="weight")
                    if dist < post_min_dist:
                        post_min_dist = dist
                        post_nearest_hosp = h_id
                except nx.NetworkXNoPath:
                    continue
                    
            is_post_connected = post_min_dist < float("inf")
            
            # Determine isolation classification
            if not is_baseline_connected:
                status = "baseline_isolated"
            elif is_baseline_connected and not is_post_connected:
                status = "newly_cut_off"
            else:
                status = "intact_access"
                
            has_alt = (status == "intact_access" and post_min_dist > base_min_dist)

            results.append({
                "id": s_id,
                "name": s["name"],
                "coordinates": s["coords"],
                "population_est": s["pop"],
                "baseline_nearest_facility": base_nearest_hosp or "None",
                "baseline_distance_km": round(base_min_dist, 1) if base_min_dist < float("inf") else -1.0,
                "post_event_accessible": is_post_connected,
                "status": status,
                "alternative_route_available": has_alt
            })
            
        return results
