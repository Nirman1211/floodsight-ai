import sys
import json
import argparse
from pathlib import Path

# Add project root and backend to sys.path
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
for p in [str(ROOT_DIR), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.services.pipeline_runner import PipelineRunner
from geospatial.validation.emsr927_comparator import EMSR927Comparator

def main():
    parser = argparse.ArgumentParser(
        prog="floodsight",
        description="FloodSight AI — Multimodal Satellite Disaster Assessment CLI"
    )
    subparsers = parser.add_subparsers(dest="command", help="Sub-commands")

    # Command: run
    run_parser = subparsers.add_parser("run", help="Run end-to-end disaster analysis")
    run_parser.add_argument("--name", type=str, default="Trishuli Flood Assessment", help="Analysis job name")
    run_parser.add_argument("--bbox", type=str, default="85.15,27.90,85.35,28.18", help="Bounding box min_lon,min_lat,max_lon,max_lat")
    run_parser.add_argument("--date", type=str, default="2026-08-26", help="Flood event date (YYYY-MM-DD)")
    run_parser.add_argument("--slope", type=float, default=15.0, help="Max DEM slope angle (degrees)")
    run_parser.add_argument("--output", type=str, default=None, help="Output JSON path")
    run_parser.add_argument("--compare-emsr", action="store_true", help="Compare with Copernicus EMSR927")

    # Command: evaluate
    eval_parser = subparsers.add_parser("evaluate", help="Evaluate ML model vs Baseline")

    args = parser.parse_args()

    if args.command == "run":
        bbox = [float(x.strip()) for x in args.bbox.split(",")]
        print(f"[*] Starting FloodSight AI analysis for '{args.name}'...")
        print(f"[*] AOI BBox: {bbox} | Event Date: {args.date} | Slope Gate: {args.slope}°")
        
        result = PipelineRunner.execute_analysis("cli_job_01", {
            "name": args.name,
            "bbox": bbox,
            "event_date": args.date,
            "slope_threshold_deg": args.slope
        })

        print("\n" + "=" * 60)
        print("FLOODSIGHT AI: ANALYSIS COMPLETE")
        print("=" * 60)
        print(f"Total Inundated / Debris Extent : {result['total_flood_area_km2']} km² ({result['total_flood_area_hectares']} ha)")
        print(f"Exposed Road Network Length     : {result['infrastructure']['exposed_road_length_km']} km ({result['infrastructure']['percentage_road_disrupted']}%)")
        print(f"Exposed Bridges Count           : {result['infrastructure']['exposed_bridges_count']} / {result['infrastructure']['total_bridges']}")
        print(f"Exposed Building Footprints     : {result['infrastructure']['exposed_buildings_count']}")
        print(f"Newly Cut-Off Settlements       : {result['cut_off_settlements_count']} villages")
        print(f"Official Situation Report PDF   : {result['pdf_report_path']}")

        if args.compare_emsr:
            print("\n[*] Comparing frozen prediction with Copernicus EMSR927 reference polygon...")
            comp = EMSR927Comparator.compare_with_prediction(result["flood_geojson"], bbox)
            m = comp["comparison_metrics"]
            print(f"    - IoU (Jaccard) : {m['iou_jaccard']}")
            print(f"    - Precision     : {m['precision']}")
            print(f"    - Recall        : {m['recall']}")

        if args.output:
            with open(args.output, "w") as f:
                json.dump(result, f, indent=2)
            print(f"\n[+] Full results written to {args.output}")

    elif args.command == "evaluate":
        from ml.evaluation.evaluate import evaluate_models
        evaluate_models()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
