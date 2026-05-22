import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Thermometer, Droplets, Clock, CheckSquare, Square } from 'lucide-react';
import { CONFIG } from '../config';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Controls state
  const [timeFilter, setTimeFilter] = useState('all'); // '1h', '3h', '6h', '24h', 'all', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [visibleRooms, setVisibleRooms] = useState(
    CONFIG.rooms.reduce((acc, room) => ({...acc, [room.id]: true}), {})
  );

  const toggleRoom = (roomId) => {
    setVisibleRooms(prev => ({...prev, [roomId]: !prev[roomId]}));
  };

  useEffect(() => {
    let intervalId;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fetchPromises = CONFIG.rooms.map(room => {
          const url = `https://docs.google.com/spreadsheets/d/${CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(room.sheetName)}`;
          
          return new Promise((resolve, reject) => {
            Papa.parse(url, {
              download: true,
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                const roomData = results.data.map(row => {
                  const values = Object.values(row);
                  let rawTime = values[0] || '';
                  
                  // Keep full timestamp for sorting/filtering
                  let timestamp = new Date(rawTime).getTime();
                  if (isNaN(timestamp)) timestamp = 0;

                  let timeStr = rawTime;
                  if(timeStr.includes(' ')) {
                    timeStr = timeStr.split(' ')[1];
                  }
                  
                  return {
                    timestamp,
                    time: timeStr,
                    rawDate: rawTime,
                    [`${room.id}_temp`]: parseFloat(values[1]) || null,
                    [`${room.id}_hum`]: parseFloat(values[2]) || null
                  };
                });
                resolve(roomData);
              },
              error: (err) => {
                reject(new Error(`Failed to fetch ${room.sheetName}: ${err.message}`));
              }
            });
          });
        });

        const allRoomsData = await Promise.all(fetchPromises);
        
        // Merge data by time
        const mergedDataMap = {};
        
        allRoomsData.forEach(roomDataArray => {
          roomDataArray.forEach(item => {
            if (!item.time) return;
            if (!mergedDataMap[item.timestamp]) {
              mergedDataMap[item.timestamp] = { time: item.time, rawDate: item.rawDate, timestamp: item.timestamp };
            }
            Object.assign(mergedDataMap[item.timestamp], item);
          });
        });

        // Convert map to sorted array
        const finalData = Object.values(mergedDataMap).sort((a, b) => a.timestamp - b.timestamp);
        
        setData(finalData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
    intervalId = setInterval(fetchData, CONFIG.refreshIntervalMs);

    return () => clearInterval(intervalId);
  }, []);

  // Filtered Data based on time selection
  const filteredData = useMemo(() => {
    if (data.length === 0) return data;
    
    if (timeFilter === 'custom') {
      let filtered = data;
      if (startDate) {
        // Start of the selected day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter(item => item.timestamp >= start.getTime());
      }
      if (endDate) {
        // End of the selected day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => item.timestamp <= end.getTime());
      }
      return filtered;
    }
    
    if (timeFilter === 'all') return data;
    
    const latestTimestamp = data[data.length - 1].timestamp;
    let cutoff = 0;
    if (timeFilter === '1h') cutoff = 60 * 60 * 1000;
    else if (timeFilter === '3h') cutoff = 3 * 60 * 60 * 1000;
    else if (timeFilter === '6h') cutoff = 6 * 60 * 60 * 1000;
    else if (timeFilter === '24h') cutoff = 24 * 60 * 60 * 1000;
    
    const minTimestamp = latestTimestamp - cutoff;
    return data.filter(item => item.timestamp >= minTimestamp);
  }, [data, timeFilter, startDate, endDate]);

  // Calculate Averages
  const averages = useMemo(() => {
    const avgs = {};
    CONFIG.rooms.forEach(room => {
      let tempSum = 0, humSum = 0;
      let tempCount = 0, humCount = 0;
      
      filteredData.forEach(row => {
        if (row[`${room.id}_temp`] != null) {
          tempSum += row[`${room.id}_temp`];
          tempCount++;
        }
        if (row[`${room.id}_hum`] != null) {
          humSum += row[`${room.id}_hum`];
          humCount++;
        }
      });
      
      avgs[room.id] = {
        temp: tempCount > 0 ? (tempSum / tempCount).toFixed(1) : '--',
        hum: humCount > 0 ? (humSum / humCount).toFixed(1) : '--'
      };
    });
    return avgs;
  }, [filteredData]);

  if (loading && data.length === 0) {
    return <div className="loading">Loading dashboard data from Google Sheets...</div>;
  }

  if (error) {
    return <div className="loading" style={{color: '#ef4444'}}>Error: {error}</div>;
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header text-center">
        <h2>Tapo Central Dashboard</h2>
        <p>Real-time Environment Monitoring & Analytics</p>
      </div>

      {/* Control Panel */}
      <div className="glass-panel control-panel">
        <div className="control-group">
          <label><Clock size={18} /> ช่วงเวลาที่ต้องการดู:</label>
          <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center'}}>
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="modern-select">
              <option value="1h">1 ชั่วโมงล่าสุด</option>
              <option value="3h">3 ชั่วโมงล่าสุด</option>
              <option value="6h">6 ชั่วโมงล่าสุด</option>
              <option value="24h">24 ชั่วโมงล่าสุด</option>
              <option value="all">ทั้งหมด (All Time)</option>
              <option value="custom">📅 เลือกวันที่เอง...</option>
            </select>

            {timeFilter === 'custom' && (
              <div className="date-picker-group">
                <input 
                  type="date" 
                  className="modern-input" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  title="วันที่เริ่มต้น"
                />
                <span style={{color: 'var(--text-muted)', fontWeight: 600}}>ถึง</span>
                <input 
                  type="date" 
                  className="modern-input" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  title="วันที่สิ้นสุด"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="control-group toggles-group">
          <label>เลือกเปิด/ปิดกราฟของแต่ละห้อง:</label>
          <div className="room-toggles">
            {CONFIG.rooms.map(room => (
              <div 
                key={room.id} 
                className={`room-toggle ${visibleRooms[room.id] ? 'active' : ''}`}
                onClick={() => toggleRoom(room.id)}
                style={{ '--room-color': room.color }}
              >
                {visibleRooms[room.id] ? <CheckSquare size={16} /> : <Square size={16} />}
                {room.icon} {room.sheetName}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Averages Section */}
      <div className="averages-container">
        <h3>📊 ค่าเฉลี่ยตามช่วงเวลาที่เลือก (Averages)</h3>
        <div className="stats-grid">
          {CONFIG.rooms.map(room => {
            if (!visibleRooms[room.id]) return null;
            return (
              <div key={`avg-${room.id}`} className="glass-panel stat-card" style={{ '--card-color': room.color }}>
                <div className="stat-title" style={{color: room.color}}>
                  {room.icon} {room.sheetName}
                </div>
                <div className="stat-values-row">
                  <div>
                    <span className="stat-label">อุณหภูมิ:</span>
                    <span className="stat-val">{averages[room.id].temp}°C</span>
                  </div>
                  <div>
                    <span className="stat-label">ความชื้น:</span>
                    <span className="stat-val">{averages[room.id].hum}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section - Side by Side */}
      <div className="charts-grid-side-by-side">
        {/* Temperature Chart */}
        <div className="glass-panel chart-container">
          <h3><Thermometer size={24} color="#ef4444" style={{marginRight: 8}} /> กราฟอุณหภูมิ (°C)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              {/* tickFormatter is used to extract only the HH:mm portion, removing the long date clutter */}
              <XAxis 
                dataKey="rawDate" 
                stroke="var(--text-muted)" 
                tick={{fill: 'var(--text-muted)', fontSize: 12}} 
                tickFormatter={(val) => {
                  if (val.includes(' ')) return val.split(' ')[1];
                  return val;
                }}
              />
              <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-main)' }}
                labelFormatter={(label) => `วันที่-เวลา: ${label}`}
              />
              {/* Removed the <Legend /> component to save space on mobile */}
              {CONFIG.rooms.map(room => visibleRooms[room.id] && (
                <Line 
                  key={`${room.id}_temp`}
                  type="monotone" 
                  dataKey={`${room.id}_temp`} 
                  name={`${room.icon} ${room.sheetName}`} 
                  stroke={room.color} 
                  strokeWidth={2} /* Reduced thickness from 3 to 2 */
                  dot={false}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Humidity Chart */}
        <div className="glass-panel chart-container">
          <h3><Droplets size={24} color="#38bdf8" style={{marginRight: 8}} /> กราฟความชื้น (%)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="rawDate" 
                stroke="var(--text-muted)" 
                tick={{fill: 'var(--text-muted)', fontSize: 12}} 
                tickFormatter={(val) => {
                  if (val.includes(' ')) return val.split(' ')[1];
                  return val;
                }}
              />
              <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-main)' }}
                labelFormatter={(label) => `วันที่-เวลา: ${label}`}
              />
              {CONFIG.rooms.map(room => visibleRooms[room.id] && (
                <Line 
                  key={`${room.id}_hum`}
                  type="monotone" 
                  dataKey={`${room.id}_hum`} 
                  name={`${room.icon} ${room.sheetName}`} 
                  stroke={room.color} 
                  strokeWidth={2} /* Reduced thickness */
                  dot={false}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
