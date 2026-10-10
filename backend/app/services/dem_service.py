import numpy as np
from typing import List, Tuple

class DEMService:
    """
    Copernicus DEM (30m) processing:
    - Calculates topographic slope in degrees.
    - Hydrological downhill path tracing (D8 flow direction gradient).
    """
    
    @staticmethod
    def compute_slope(elevation: np.ndarray, cell_size_m: float = 30.0) -> np.ndarray:
        """
        Calculates terrain slope in degrees using Horn's method (central finite differences).
        """
        gy, gx = np.gradient(elevation, cell_size_m)
        slope_rad = np.arctan(np.sqrt(gx**2 + gy**2))
        slope_deg = np.degrees(slope_rad)
        return slope_deg

    @staticmethod
    def trace_downhill_path(
        elevation: np.ndarray,
        start_row: int,
        start_col: int,
        max_steps: int = 500
    ) -> List[Tuple[int, int]]:
        """
        Traces steepest downhill descent path across the DEM matrix (D8 flow routing).
        """
        nrows, ncols = elevation.shape
        path = [(start_row, start_col)]
        current_r, current_c = start_row, start_col
        
        # 8-connected neighbors
        neighbors = [
            (-1, -1), (-1, 0), (-1, 1),
            (0, -1),           (0, 1),
            (1, -1),  (1, 0),  (1, 1)
        ]
        
        for _ in range(max_steps):
            lowest_val = elevation[current_r, current_c]
            best_r, best_c = current_r, current_c
            
            for dr, dc in neighbors:
                nr, nc = current_r + dr, current_c + dc
                if 0 <= nr < nrows and 0 <= nc < ncols:
                    if elevation[nr, nc] < lowest_val:
                        lowest_val = elevation[nr, nc]
                        best_r, best_c = nr, nc
            
            # If local minimum (pit) or reached valley floor boundary, terminate
            if (best_r, best_c) == (current_r, current_c):
                break
                
            path.append((best_r, best_c))
            current_r, current_c = best_r, best_c
            
        return path
