import React, { useState } from 'react';
import axios from 'axios';

const API = ((window.ENV?.REACT_APP_BACKEND_URL || window.location.origin) || window.location.origin) + '/api';

const CalculatorDashboard = ({ projectId }) => {
  const [activeCalculator, setActiveCalculator] = useState('wallpaper');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // WALLPAPER CALCULATOR STATE - BY ROOM SIZE
  const [wallpaperData, setWallpaperData] = useState({
    wallpaper_type: 'double_roll',
    room_length: '',      // Room length in feet
    room_width: '',       // Room width in feet
    wall_height: '',      // Wall height in feet
    num_doors: 0,         // Number of standard doors to deduct
    num_windows: 0,       // Number of standard windows to deduct
    pattern_repeat: 0,    // Pattern repeat in inches
    roll_width: 27,       // Standard wallpaper roll width in inches
    roll_length: 33,      // Double roll length in feet (standard is 33ft)
    cost_per_roll: '',    // Cost per double roll
    cost_per_yard: ''     // Cost per yard (for by-yard type)
  });

  // DRAPERY CALCULATOR STATE
  const [draperyData, setDraperyData] = useState({
    window_width: '',
    finished_length: '',
    pleat_type: 'pinch_pleat',
    fullness_ratio: 2.5,
    fabric_width: 54,
    pattern_repeat: null,
    include_lining: false,
    cost_per_yard: ''  // NEW
  });

  // HARDWARE CALCULATOR STATE
  const [hardwareData, setHardwareData] = useState({
    window_width: '',
    rod_overhang_per_side: 6,
    rod_diameter: 1.0,
    drapery_weight: 'medium',
    cost_per_rod: '',  // NEW
    cost_per_bracket: ''  // NEW
  });

  // PAINT CALCULATOR STATE
  const [paintData, setPaintData] = useState({
    room_length: '',
    room_width: '',
    wall_height: '',
    coats: 2,
    coverage_per_gallon: 350
  });

  // FLOORING CALCULATOR STATE
  const [flooringData, setFlooringData] = useState({
    room_length: '',
    room_width: '',
    tile_length: 12,
    tile_width: 12,
    waste_factor: 0.10,
    cost_per_sqft: ''  // NEW
  });

  // LIGHTING CALCULATOR STATE
  const [lightingData, setLightingData] = useState({
    room_length: '',
    room_width: '',
    room_type: 'living_room'
  });

  const calculateWallpaper = async () => {
    // Validate required fields
    if (!wallpaperData.room_length || !wallpaperData.room_width || !wallpaperData.wall_height) {
      alert('Please enter Room Length, Room Width, and Wall Height');
      return;
    }
    
    setLoading(true);
    try {
      // Calculate locally for instant results
      const roomLength = parseFloat(wallpaperData.room_length);
      const roomWidth = parseFloat(wallpaperData.room_width);
      const wallHeight = parseFloat(wallpaperData.wall_height);
      const rollWidth = parseFloat(wallpaperData.roll_width) || 27; // inches
      const rollLength = parseFloat(wallpaperData.roll_length) || 33; // feet (double roll)
      const patternRepeat = parseFloat(wallpaperData.pattern_repeat) || 0;
      const numDoors = parseInt(wallpaperData.num_doors) || 0;
      const numWindows = parseInt(wallpaperData.num_windows) || 0;
      
      // Calculate total wall perimeter (all 4 walls)
      const perimeter = 2 * (roomLength + roomWidth);
      
      // Total wall area in sq ft
      const totalWallArea = perimeter * wallHeight;
      
      // Deduct for doors (standard door ~21 sq ft = 3ft x 7ft)
      const doorDeduction = numDoors * 21;
      
      // Deduct for windows (standard window ~15 sq ft = 3ft x 5ft)
      const windowDeduction = numWindows * 15;
      
      // Net wall area
      const netWallArea = Math.max(totalWallArea - doorDeduction - windowDeduction, 0);
      
      // Convert roll width from inches to feet
      const rollWidthFeet = rollWidth / 12;
      
      // Usable coverage per double roll (sq ft)
      // Double roll = roll_length ft long x roll_width in wide
      let usableCoveragePerRoll = rollLength * rollWidthFeet;
      
      // Adjust for pattern repeat (reduces usable area by ~15% for patterns)
      if (patternRepeat > 0) {
        const repeatFactor = 0.85; // 15% waste for pattern matching
        usableCoveragePerRoll *= repeatFactor;
      }
      
      // Calculate double rolls needed (round up)
      const doubleRollsNeeded = Math.ceil(netWallArea / usableCoveragePerRoll);
      
      // Calculate yards needed (1 double roll ≈ 11 yards of wallpaper)
      // Formula: roll_length (33ft) / 3 = 11 yards per double roll
      const yardsPerRoll = rollLength / 3;
      const totalYardsNeeded = Math.ceil(doubleRollsNeeded * yardsPerRoll);
      
      // Calculate costs
      let totalCostRolls = null;
      let totalCostYards = null;
      
      if (wallpaperData.cost_per_roll) {
        totalCostRolls = (parseFloat(wallpaperData.cost_per_roll) * doubleRollsNeeded).toFixed(2);
      }
      if (wallpaperData.cost_per_yard) {
        totalCostYards = (parseFloat(wallpaperData.cost_per_yard) * totalYardsNeeded).toFixed(2);
      }
      
      const res = {
        data: {
          room_dimensions: `${roomLength}' x ${roomWidth}' x ${wallHeight}'h`,
          total_wall_area: totalWallArea.toFixed(1),
          deductions: `${numDoors} doors, ${numWindows} windows (${(doorDeduction + windowDeduction).toFixed(0)} sq ft)`,
          net_wall_area: netWallArea.toFixed(1),
          coverage_per_roll: usableCoveragePerRoll.toFixed(1),
          double_rolls_needed: doubleRollsNeeded,
          yards_needed: totalYardsNeeded,
          cost_per_roll: wallpaperData.cost_per_roll || 'N/A',
          cost_per_yard: wallpaperData.cost_per_yard || 'N/A',
          total_cost_rolls: totalCostRolls ? `$${totalCostRolls}` : 'Enter cost per roll',
          total_cost_yards: totalCostYards ? `$${totalCostYards}` : 'Enter cost per yard'
        }
      };
      
      setResults(res.data);
    } catch (error) {
      const errorMsg = error.response?.data?.detail?.[0]?.msg || error.response?.data?.detail || error.message;
      alert('Error calculating wallpaper: ' + errorMsg);
    }
    setLoading(false);
  };

  const calculateDrapery = async () => {
    // Validate required fields
    if (!draperyData.window_width || !draperyData.finished_length) {
      alert('Please enter Window Width and Finished Length!');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        window_width: parseFloat(draperyData.window_width),
        finished_length: parseFloat(draperyData.finished_length),
        pleat_type: draperyData.pleat_type,
        fullness_ratio: parseFloat(draperyData.fullness_ratio) || 2.5,
        fabric_width: parseFloat(draperyData.fabric_width) || 54,
        pattern_repeat: draperyData.pattern_repeat ? parseFloat(draperyData.pattern_repeat) : null,
        include_lining: draperyData.include_lining
      };
      const res = await axios.post(`${API}/calculators/drapery`, payload);
      
      // Add cost calculation if cost_per_yard is provided
      if (draperyData.cost_per_yard && res.data.fabric_yardage) {
        const costPerYard = parseFloat(draperyData.cost_per_yard);
        const totalCost = costPerYard * res.data.fabric_yardage;
        res.data.cost_per_yard = costPerYard.toFixed(2);
        res.data.total_fabric_cost = totalCost.toFixed(2);
      }
      
      setResults(res.data);
    } catch (error) {
      const errorMsg = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map(e => e.msg).join(', ')
            : JSON.stringify(error.response.data.detail))
        : error.message;
      alert('Error: ' + errorMsg);
    }
    setLoading(false);
  };

  const calculateHardware = async () => {
    // Validate required field
    if (!hardwareData.window_width) {
      alert('Please enter Window Width!');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        window_width: parseFloat(hardwareData.window_width),
        rod_overhang_per_side: parseFloat(hardwareData.rod_overhang_per_side) || 6,
        rod_diameter: parseFloat(hardwareData.rod_diameter) || 1.0,
        drapery_weight: hardwareData.drapery_weight
      };
      const res = await axios.post(`${API}/calculators/hardware`, payload);
      
      // Add cost calculation
      if (hardwareData.cost_per_rod || hardwareData.cost_per_bracket) {
        const rodCost = parseFloat(hardwareData.cost_per_rod) || 0;
        const bracketCost = parseFloat(hardwareData.cost_per_bracket) || 0;
        const totalCost = rodCost + (bracketCost * res.data.brackets_needed);
        res.data.cost_per_rod = rodCost.toFixed(2);
        res.data.cost_per_bracket = bracketCost.toFixed(2);
        res.data.total_hardware_cost = totalCost.toFixed(2);
      }
      
      setResults(res.data);
    } catch (error) {
      const errorMsg = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map(e => e.msg).join(', ')
            : JSON.stringify(error.response.data.detail))
        : error.message;
      alert('Error: ' + errorMsg);
    }
    setLoading(false);
  };

  const calculatePaint = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/calculators/paint`, paintData);
      setResults(res.data);
    } catch (error) {
      alert('Error calculating paint: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const calculateFlooring = async () => {
    // Validate required fields
    if (!flooringData.room_length || !flooringData.room_width) {
      alert('Please enter Room Length and Room Width');
      return;
    }
    if (!flooringData.tile_length || !flooringData.tile_width) {
      alert('Please enter Tile Size');
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/calculators/flooring`, flooringData);
      
      // Calculate square footage
      const floorSqFt = flooringData.room_length * flooringData.room_width;
      let totalSqFt = floorSqFt;
      
      // If wall height is provided, calculate wall area too
      let wallSqFt = 0;
      if (flooringData.wall_height && flooringData.wall_height > 0) {
        // Wall area = perimeter × height
        const perimeter = 2 * (flooringData.room_length + flooringData.room_width);
        wallSqFt = perimeter * flooringData.wall_height;
        totalSqFt = wallSqFt; // For wall tiling, use wall area
        res.data.calculation_type = 'Wall Tiling';
        res.data.wall_height = `${flooringData.wall_height} ft`;
        res.data.wall_square_footage = wallSqFt.toFixed(2);
        res.data.perimeter = `${perimeter.toFixed(2)} ft`;
      } else {
        res.data.calculation_type = 'Floor Tiling';
        totalSqFt = floorSqFt;
      }
      
      // Apply waste factor
      const wasteFactor = flooringData.waste_factor || 0.10;
      const totalSqFtNeeded = totalSqFt * (1 + wasteFactor);
      
      // Calculate tiles needed
      const tileSqFt = (flooringData.tile_length * flooringData.tile_width) / 144; // Convert sq inches to sq feet
      const tilesNeeded = Math.ceil(totalSqFtNeeded / tileSqFt);
      
      // Add to results
      res.data.tile_size = `${flooringData.tile_length}" x ${flooringData.tile_width}"`;
      res.data.total_sqft_with_waste = totalSqFtNeeded.toFixed(2);
      res.data.tiles_needed = tilesNeeded;
      
      // Add cost calculation if cost_per_sqft is provided
      if (flooringData.cost_per_sqft) {
        const costPerSqft = parseFloat(flooringData.cost_per_sqft);
        const totalCost = costPerSqft * totalSqFtNeeded;
        res.data.cost_per_sqft = `$${costPerSqft.toFixed(2)}`;
        res.data.total_flooring_cost = `$${totalCost.toFixed(2)}`;
      }
      
      setResults(res.data);
    } catch (error) {
      alert('Error calculating flooring: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const calculateLighting = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/calculators/lighting`, lightingData);
      setResults(res.data);
    } catch (error) {
      alert('Error calculating lighting: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const calculators = [
    { id: 'wallpaper', name: '📐 Wallpaper', icon: '🎨' },
    { id: 'drapery', name: '🪟 Drapery', icon: '🪟' },
    { id: 'hardware', name: '🔧 Hardware', icon: '🔧' },
    { id: 'paint', name: '🎨 Paint', icon: '🖌️' },
    { id: 'flooring', name: '⬜ Tile & Flooring', icon: '⬜' },
    { id: 'lighting', name: '💡 Lighting', icon: '💡' },
    { id: 'sqft', name: '📏 Square Ft', icon: '📐' },
    { id: 'convert', name: '🔄 Convert', icon: '🔄' }
  ];

  return (
    <div className="calculator-dashboard" style={styles.dashboard}>
      <div style={styles.header}>
        <h2 style={styles.title}>🧮 Professional Calculators</h2>
        <p style={styles.subtitle}>Industry-standard calculations for all your design needs</p>
      </div>

      {/* Calculator Selector */}
      <div style={styles.calculatorSelector}>
        {calculators.map(calc => (
          <button
            key={calc.id}
            onClick={() => {
              setActiveCalculator(calc.id);
              setResults(null);
            }}
            style={{
              ...styles.calcButton,
              ...(activeCalculator === calc.id ? styles.calcButtonActive : {})
            }}
          >
            <span style={styles.calcIcon}>{calc.icon}</span>
            <span>{calc.name}</span>
          </button>
        ))}
      </div>

      {/* Calculator Forms */}
      <div style={styles.calculatorContent}>
        {/* WALLPAPER CALCULATOR */}
        {activeCalculator === 'wallpaper' && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>📐 Wallpaper Calculator</h3>
            <p style={styles.formSubtitle}>Calculate wallpaper needed for Double Roll, Mural, or By-Yard</p>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Wallpaper Type</label>
              <select
                value={wallpaperData.wallpaper_type}
                onChange={(e) => setWallpaperData({...wallpaperData, wallpaper_type: e.target.value})}
                style={styles.select}
              >
                <option value="double_roll">Double Roll</option>
                <option value="mural">Mural</option>
                <option value="by_yard">By Yard</option>
              </select>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Wall Width (feet)</label>
                <input
                  type="number"
                  value={wallpaperData.wall_width}
                  onChange={(e) => setWallpaperData({...wallpaperData, wall_width: parseFloat(e.target.value)})}
                  style={styles.input}
                  placeholder="12"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Wall Height (feet)</label>
                <input
                  type="number"
                  value={wallpaperData.wall_height}
                  onChange={(e) => setWallpaperData({...wallpaperData, wall_height: parseFloat(e.target.value)})}
                  style={styles.input}
                  placeholder="9"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Roll Width (inches)</label>
                <input
                  type="number"
                  value={wallpaperData.roll_width}
                  onChange={(e) => setWallpaperData({...wallpaperData, roll_width: parseFloat(e.target.value)})}
                  style={styles.input}
                  placeholder="27"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Pattern Repeat (inches)</label>
                <input
                  type="number"
                  value={wallpaperData.pattern_repeat}
                  onChange={(e) => setWallpaperData({...wallpaperData, pattern_repeat: parseFloat(e.target.value)})}
                  style={styles.input}
                  placeholder="24"
                />
              </div>
            </div>


            <div style={styles.formGroup}>
              <label style={styles.label}>
                {wallpaperData.wallpaper_type === 'by_yard' ? 'Cost Per Yard ($)' : 'Cost Per Double Roll ($)'} - Optional
              </label>
              <input
                type="number"
                value={wallpaperData.cost_per_unit}
                onChange={(e) => setWallpaperData({...wallpaperData, cost_per_unit: e.target.value})}
                style={styles.input}
                placeholder="125.00"
              />
            </div>


            <button onClick={calculateWallpaper} disabled={loading} style={styles.calculateButton}>
              {loading ? '⏳ Calculating...' : '🧮 Calculate Wallpaper'}
            </button>
          </div>
        )}

        {/* DRAPERY CALCULATOR */}
        {activeCalculator === 'drapery' && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>🪟 Drapery Fabric Calculator</h3>
            <p style={styles.formSubtitle}>Calculate yardage for all pleat types with fullness ratios</p>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Window Width (inches)</label>
                <input
                  type="number"
                  value={draperyData.window_width}
                  onChange={(e) => setDraperyData({...draperyData, window_width: e.target.value})}
                  style={styles.input}
                  placeholder="80"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Finished Length (inches)</label>
                <input
                  type="number"
                  value={draperyData.finished_length}
                  onChange={(e) => setDraperyData({...draperyData, finished_length: e.target.value})}
                  style={styles.input}
                  placeholder="84"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Pleat Type</label>
                <select
                  value={draperyData.pleat_type}
                  onChange={(e) => setDraperyData({...draperyData, pleat_type: e.target.value})}
                  style={styles.select}
                >
                  <option value="pinch_pleat">Pinch Pleat</option>
                  <option value="goblet">Goblet</option>
                  <option value="grommet">Grommet</option>
                  <option value="rod_pocket">Rod Pocket</option>
                  <option value="ripplefold">Ripplefold</option>
                  <option value="box_pleat">Box Pleat</option>
                  <option value="euro_pleat">Euro Pleat</option>
                  <option value="tab_top">Tab Top</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fullness Ratio</label>
                <select
                  value={draperyData.fullness_ratio}
                  onChange={(e) => setDraperyData({...draperyData, fullness_ratio: parseFloat(e.target.value)})}
                  style={styles.select}
                >
                  <option value="1.5">1.5x</option>
                  <option value="2.0">2.0x</option>
                  <option value="2.5">2.5x</option>
                  <option value="3.0">3.0x</option>
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={draperyData.include_lining}
                  onChange={(e) => setDraperyData({...draperyData, include_lining: e.target.checked})}
                  style={styles.checkbox}
                />
                Include Lining Calculation
              </label>
            </div>

            <button onClick={calculateDrapery} disabled={loading} style={styles.calculateButton}>
              {loading ? '⏳ Calculating...' : '🧮 Calculate Drapery'}
            </button>
          </div>
        )}

        {/* HARDWARE CALCULATOR */}
        {activeCalculator === 'hardware' && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>🔧 Drapery Hardware Calculator</h3>
            <p style={styles.formSubtitle}>Calculate rod width and bracket requirements (60-240")</p>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Window Width (inches)</label>
                <input
                  type="number"
                  value={hardwareData.window_width}
                  onChange={(e) => setHardwareData({...hardwareData, window_width: e.target.value})}
                  style={styles.input}
                  placeholder="60-240"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Rod Overhang Per Side (inches)</label>
                <input
                  type="number"
                  value={hardwareData.rod_overhang_per_side}
                  onChange={(e) => setHardwareData({...hardwareData, rod_overhang_per_side: e.target.value})}
                  style={styles.input}
                  placeholder="6"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Rod Diameter (inches)</label>
                <select
                  value={hardwareData.rod_diameter}
                  onChange={(e) => setHardwareData({...hardwareData, rod_diameter: parseFloat(e.target.value)})}
                  style={styles.select}
                >
                  <option value="0.5">1/2"</option>
                  <option value="0.75">3/4"</option>
                  <option value="1.0">1"</option>
                  <option value="1.25">1 1/4"</option>
                  <option value="1.5">1 1/2"</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Drapery Weight</label>
                <select
                  value={hardwareData.drapery_weight}
                  onChange={(e) => setHardwareData({...hardwareData, drapery_weight: e.target.value})}
                  style={styles.select}
                >
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
            </div>

            <button onClick={calculateHardware} disabled={loading} style={styles.calculateButton}>
              {loading ? '⏳ Calculating...' : '🧮 Calculate Hardware'}
            </button>
          </div>
        )}

        {/* PAINT CALCULATOR */}
        {activeCalculator === 'paint' && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>🎨 Paint Calculator</h3>
            <p style={styles.formSubtitle}>Calculate gallons needed for your room</p>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Room Length (feet)</label>
                <input
                  type="number"
                  value={paintData.room_length}
                  onChange={(e) => setPaintData({...paintData, room_length: parseFloat(e.target.value)})}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Room Width (feet)</label>
                <input
                  type="number"
                  value={paintData.room_width}
                  onChange={(e) => setPaintData({...paintData, room_width: parseFloat(e.target.value)})}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Wall Height (feet)</label>
                <input
                  type="number"
                  value={paintData.wall_height}
                  onChange={(e) => setPaintData({...paintData, wall_height: parseFloat(e.target.value)})}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Number of Coats</label>
                <input
                  type="number"
                  value={paintData.coats}
                  onChange={(e) => setPaintData({...paintData, coats: parseInt(e.target.value)})}
                  style={styles.input}
                />
              </div>
            </div>

            <button onClick={calculatePaint} disabled={loading} style={styles.calculateButton}>
              {loading ? '⏳ Calculating...' : '🧮 Calculate Paint'}
            </button>
          </div>
        )}

        {/* FLOORING CALCULATOR */}
        {activeCalculator === 'flooring' && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>⬜ Tile/Flooring Calculator</h3>
            <p style={styles.formSubtitle}>Calculate tiles needed for floors or walls with waste factor and total cost</p>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Room Length (feet)</label>
                <input
                  type="number"
                  value={flooringData.room_length}
                  onChange={(e) => setFlooringData({...flooringData, room_length: parseFloat(e.target.value)})}
                  style={styles.input}
                  placeholder="12"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Room Width (feet)</label>
                <input
                  type="number"
                  value={flooringData.room_width}
                  onChange={(e) => setFlooringData({...flooringData, room_width: parseFloat(e.target.value)})}
                  style={styles.input}
                  placeholder="10"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Wall Height (feet) <span style={{color: '#888', fontSize: '11px'}}>- for walls only</span></label>
                <input
                  type="number"
                  value={flooringData.wall_height || ''}
                  onChange={(e) => setFlooringData({...flooringData, wall_height: e.target.value ? parseFloat(e.target.value) : null})}
                  style={styles.input}
                  placeholder="8 (optional)"
                />
              </div>
            </div>

            {/* Tile Size - Preset or Custom */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Tile Size Preset</label>
              <select
                value={`${flooringData.tile_length}x${flooringData.tile_width}`}
                onChange={(e) => {
                  if (e.target.value === 'custom') return;
                  const [l, w] = e.target.value.split('x').map(Number);
                  setFlooringData({...flooringData, tile_length: l, tile_width: w});
                }}
                style={styles.select}
              >
                <option value="4x4">4" x 4"</option>
                <option value="6x6">6" x 6"</option>
                <option value="8x8">8" x 8"</option>
                <option value="12x12">12" x 12"</option>
                <option value="12x24">12" x 24"</option>
                <option value="18x18">18" x 18"</option>
                <option value="24x24">24" x 24"</option>
                <option value="6x36">6" x 36" (Plank)</option>
                <option value="6x48">6" x 48" (Long Plank)</option>
                <option value="custom">Custom Size (enter below)</option>
              </select>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tile Length (inches)</label>
                <input
                  type="number"
                  value={flooringData.tile_length}
                  onChange={(e) => setFlooringData({...flooringData, tile_length: parseFloat(e.target.value)})}
                  style={styles.input}
                  placeholder="12"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tile Width (inches)</label>
                <input
                  type="number"
                  value={flooringData.tile_width}
                  onChange={(e) => setFlooringData({...flooringData, tile_width: parseFloat(e.target.value)})}
                  style={styles.input}
                  placeholder="12"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Waste Factor (%)</label>
                <input
                  type="number"
                  value={flooringData.waste_factor * 100}
                  onChange={(e) => setFlooringData({...flooringData, waste_factor: parseFloat(e.target.value) / 100})}
                  style={styles.input}
                  placeholder="10"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cost Per Sq Ft ($)</label>
                <input
                  type="number"
                  value={flooringData.cost_per_sqft}
                  onChange={(e) => setFlooringData({...flooringData, cost_per_sqft: e.target.value})}
                  style={styles.input}
                  placeholder="5.99"
                  step="0.01"
                />
              </div>
            </div>

            <button onClick={calculateFlooring} disabled={loading} style={styles.calculateButton}>
              {loading ? '⏳ Calculating...' : '🧮 Calculate Flooring'}
            </button>
          </div>
        )}

        {/* LIGHTING CALCULATOR */}
        {activeCalculator === 'lighting' && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>💡 Lighting Calculator</h3>
            <p style={styles.formSubtitle}>Calculate lumens needed based on room type</p>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Room Length (feet)</label>
                <input
                  type="number"
                  value={lightingData.room_length}
                  onChange={(e) => setLightingData({...lightingData, room_length: parseFloat(e.target.value)})}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Room Width (feet)</label>
                <input
                  type="number"
                  value={lightingData.room_width}
                  onChange={(e) => setLightingData({...lightingData, room_width: parseFloat(e.target.value)})}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Room Type</label>
              <select
                value={lightingData.room_type}
                onChange={(e) => setLightingData({...lightingData, room_type: e.target.value})}
                style={styles.select}
              >
                <option value="living_room">Living Room</option>
                <option value="kitchen">Kitchen</option>
                <option value="bedroom">Bedroom</option>
                <option value="bathroom">Bathroom</option>
                <option value="dining_room">Dining Room</option>
                <option value="office">Office</option>
              </select>
            </div>

            <button onClick={calculateLighting} disabled={loading} style={styles.calculateButton}>
              {loading ? '⏳ Calculating...' : '🧮 Calculate Lighting'}
            </button>
          </div>
        )}
      </div>



        {/* SQUARE FOOTAGE CALCULATOR */}
        {activeCalculator === 'sqft' && (
          <div style={styles.form}>
            <h3 style={styles.formTitle}>📏 Square Footage Calculator</h3>
            <p style={styles.formSubtitle}>Calculate total square footage for rooms</p>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Length (feet)</label>
                <input
                  type="number"
                  placeholder="Enter length"
                  style={styles.input}
                  id="sqft-length"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Width (feet)</label>
                <input
                  type="number"
                  placeholder="Enter width"
                  style={styles.input}
                  id="sqft-width"
                />
              </div>
            </div>

            <button 
              onClick={async () => {
                setLoading(true);
                try {
                  const length = parseFloat(document.getElementById('sqft-length').value);
                  const width = parseFloat(document.getElementById('sqft-width').value);
                  const res = await axios.post(`${API}/calculators/square-footage`, { length, width });
                  setResults(res.data);
                } catch (error) {
                  alert('Error: ' + (error.response?.data?.detail || error.message));
                }
                setLoading(false);
              }}
              disabled={loading}
              style={styles.calculateButton}
            >
              {loading ? 'Calculating...' : 'Calculate Square Footage'}
            </button>
          </div>
        )}

      {/* RESULTS DISPLAY */}
      {results && (
        <div style={styles.results}>
          <h3 style={styles.resultsTitle}>📊 Calculation Results</h3>
          <div style={styles.resultsContent}>
            {Object.entries(results).map(([key, value]) => (
              <div key={key} style={styles.resultRow}>
                <span style={styles.resultLabel}>{key.replace(/_/g, ' ').toUpperCase()}:</span>
                <span style={styles.resultValue}>
                  {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  dashboard: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#0a0a0a',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '30px 20px',
    background: 'linear-gradient(135deg, #4a4a4a 0%, #3a3a3a 30%, #2a2a2a 70%, #1a1a1a 100%)',
    borderRadius: '10px',
    border: '1px solid #8b7355',
    boxShadow: '0 0 20px rgba(139, 115, 85, 0.3), inset 0 0 40px rgba(255, 255, 255, 0.12), inset 0 0 70px rgba(0, 0, 0, 0.4)'
  },
  title: {
    fontSize: '32px',
    fontWeight: '300',
    color: '#D4C5A9',
    margin: '0 0 10px 0',
    letterSpacing: '2px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#D4C5A9',
    margin: 0
  },
  calculatorSelector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  calcButton: {
    padding: '15px 10px',
    border: '1px solid #8b7355',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)',
    color: '#D4C5A9',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    boxShadow: '0 4px 15px rgba(139, 115, 85, 0.2)'
  },
  calcButtonActive: {
    background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)',
    borderColor: '#a0845c',
    color: '#1a1a1a',
    transform: 'scale(1.05)',
    boxShadow: '0 4px 15px rgba(139, 115, 85, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
  },
  calcIcon: {
    fontSize: '24px'
  },
  calculatorContent: {
    background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)',
    borderRadius: '10px',
    padding: '30px',
    marginBottom: '20px',
    border: '1px solid rgba(139, 115, 85, 0.3)'
  },
  form: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: '300',
    color: '#D4A574',
    marginBottom: '10px',
    letterSpacing: '1px'
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#D4C5A9',
    marginBottom: '30px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#D4C5A9',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #8b7355',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#D4C5A9',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #8b7355',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#D4C5A9',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    color: '#D4C5A9',
    fontSize: '14px',
    cursor: 'pointer'
  },
  checkbox: {
    marginRight: '10px',
    width: '20px',
    height: '20px',
    cursor: 'pointer'
  },
  calculateButton: {
    width: '100%',
    padding: '15px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #8b7355 0%, #a0845c 50%, #8b7355 100%)',
    color: '#1a1a1a',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    marginTop: '20px',
    boxShadow: '0 4px 15px rgba(139, 115, 85, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
  },
  results: {
    background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(30,30,30,0.9) 30%, rgba(0,0,0,0.95) 100%)',
    borderRadius: '10px',
    padding: '30px',
    border: '2px solid #8b7355'
  },
  resultsTitle: {
    fontSize: '24px',
    fontWeight: '300',
    color: '#D4A574',
    marginBottom: '20px',
    letterSpacing: '1px'
  },
  resultsContent: {
    display: 'grid',
    gap: '15px'
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: '8px',
    borderLeft: '4px solid #8b7355'
  },
  resultLabel: {
    color: '#D4C5A9',
    fontSize: '14px',
    fontWeight: '500'
  },
  resultValue: {
    color: '#D4A574',
    fontSize: '18px',
    fontWeight: 'bold'
  }
};

export default CalculatorDashboard;
