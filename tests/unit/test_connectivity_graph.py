import pytest
from app.services.osm_service import HistoricalOSMService
from app.services.connectivity_graph import ConnectivityGraphAnalyzer

def test_connectivity_graph_baseline_and_cut_off():
    osm_data = HistoricalOSMService.get_pre_event_infrastructure([85.15, 27.90, 85.35, 28.18])
    
    # 1. Test baseline connectivity when NO roads are cut
    baseline_status = ConnectivityGraphAnalyzer.analyze_settlement_isolation(
        osm_data=osm_data,
        exposed_road_ids=[]
    )
    
    # In baseline, all mapped settlements should have valid access to hospitals
    for s in baseline_status:
        assert s["post_event_accessible"] is True
        assert s["status"] == "intact_access"
        
    # 2. Test post-event scenario when the main highway bridge (road_seg_02) is severed
    disrupted_status = ConnectivityGraphAnalyzer.analyze_settlement_isolation(
        osm_data=osm_data,
        exposed_road_ids=["road_seg_02"] # Timure to Syaphrubesi severed
    )
    
    # Timure (set_02) and Rasuwagadhi (set_01) should now be newly_cut_off!
    isolated_ids = [s["id"] for s in disrupted_status if s["status"] == "newly_cut_off"]
    assert "set_01" in isolated_ids
    assert "set_02" in isolated_ids
    
    # Settlements south of Syaphrubesi should still have intact access
    south_settlement = next(s for s in disrupted_status if s["id"] == "set_06") # Dhunche
    assert south_settlement["status"] == "intact_access"
