import React, { useState } from 'react';
import axios from 'axios';

const API = (process.env.REACT_APP_BACKEND_URL || window.location.origin) + '/api';

const CalculatorDashboard = ({ projectId }) => {
  const [activeCalculator, setActiveCalculator] = useState('wallpaper');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // WALLPAPER CALCULATOR STATE
  const [wallpaperData, setWallpaperData] = useState({
    wallpaper_type: 'double_roll',
    wall_width: '',
    wall_height: '',
    door_widths: [],
    door_heights: [],
    window_widths: [],
    window_heights: [],
    pattern_repeat: 0,
    roll_width: 21,
    roll_length: 33,
    fabric_width: 54
  });

  // DRAPERY CALCULATOR STATE
  const [draperyData, setDraperyData] = useState({
    window_width: '',
    finished_length: '',
    pleat_type: 'pinch_pleat',
    fullness_ratio: 2.5,
    fabric_width: 54,
    pattern_repeat: null,
    include_lining: false
  });

  // HARDWARE CALCULATOR STATE
  const [hardwareData, setHardwareData] = useState({
    window_width: '',
    rod_overhang_per_side: 6,
    rod_diameter: 1.0,
    drapery_weight: 'medium'
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
    waste_factor: 0.10
  });

  // LIGHTING CALCULATOR STATE
  const [lightingData, setLightingData] = useState({
    room_length: '',
    room_width: '',
    room_type: 'living_room'
  });

  const calculateWallpaper = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/calculators/wallpaper`, wallpaperData);
      setResults(res.data);
    } catch (error) {
      alert('Error calculating wallpaper: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const calculateDrapery = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/calculators/drapery`, draperyData);
      setResults(res.data);
    } catch (error) {
      alert('Error calculating drapery: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const calculateHardware = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/calculators/hardware`, hardwareData);
      setResults(res.data);
    } catch (error) {
      alert('Error calculating hardware: ' + (error.response?.data?.detail || error.message));
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
    setLoading(true);
    try {
      const res = await axios.post(`${API}/calculators/flooring`, flooringData);
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
    { id: 'flooring', name: '⬜ Flooring', icon: '⬜' },
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
                  onChange={(e) => setDraperyData({...draperyData, window_width: parseFloat(e.target.value)})}
                  style={styles.input}
                  placeholder="80"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Finished Length (inches)</label>
                <input
                  type="number"
                  value={draperyData.finished_length}
                  onChange={(e) => setDraperyData({...draperyData, finished_length: parseFloat(e.target.value)})}
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
                  onChange={(e) => setHardwareData({...hardwareData, window_width: parseFloat(e.target.value)})}
                  style={styles.input}
                  placeholder="60-240"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Rod Overhang Per Side (inches)</label>
                <input
                  type="number"
                  value={hardwareData.rod_overhang_per_side}
                  onChange={(e) => setHardwareData({...hardwareData, rod_overhang_per_side: parseFloat(e.target.value)})}
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
            <p style={styles.formSubtitle}>Calculate tiles needed with waste factor</p>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Room Length (feet)</label>
                <input
                  type="number"
                  value={flooringData.room_length}
                  onChange={(e) => setFlooringData({...flooringData, room_length: parseFloat(e.target.value)})}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Room Width (feet)</label>
                <input
                  type="number"
                  value={flooringData.room_width}
                  onChange={(e) => setFlooringData({...flooringData, room_width: parseFloat(e.target.value)})}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tile Size (inches)</label>
                <select
                  value={`${flooringData.tile_length}x${flooringData.tile_width}`}
                  onChange={(e) => {
                    const [l, w] = e.target.value.split('x').map(Number);
                    setFlooringData({...flooringData, tile_length: l, tile_width: w});
                  }}
                  style={styles.select}
                >
                  <option value="12x12">12" x 12"</option>
                  <option value="18x18">18" x 18"</option>
                  <option value="24x24">24" x 24"</option>
                  <option value="6x36">6" x 36" (Plank)</option>
                </select>
              </div>
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
