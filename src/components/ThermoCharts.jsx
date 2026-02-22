import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ThermoCharts = ({ outputs, isDark }) => {
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';
  const markStroke = isDark ? '#0f172a' : '#f8fafc';

  return (
    <div className="space-y-6">
      {/* T-H Diagram (Gas Cycle) */}
      <div className="bg-sys-card border border-sys-border rounded-2xl p-5 shadow-xl h-[300px] transition-colors duration-300">
        <h3 className="text-sm font-semibold text-gas mb-4 flex items-center justify-between">
          <span>T-H Diagram (Brayton)</span>
          <span className="text-xs text-sys-muted bg-sys-bg px-2 py-1 rounded-md border border-sys-border">Gas Cycle</span>
        </h3>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={outputs.gasChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis 
                dataKey="H" 
                type="number" 
                domain={['dataMin - 100', 'dataMax + 100']} 
                stroke={axisColor}
                tick={{fill: axisColor, fontSize: 12}}
                label={{ value: 'Enthalpy H (kJ/kg)', position: 'insideBottom', offset: -5, fill: axisColor, fontSize: 12 }}
              />
              <YAxis 
                dataKey="T" 
                stroke={axisColor}
                tick={{fill: axisColor, fontSize: 12}}
                label={{ value: 'Temp T (K)', angle: -90, position: 'insideLeft', fill: axisColor, fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '0.5rem' }}
                itemStyle={{ color: '#f97316' }}
                labelStyle={{ color: axisColor, marginBottom: '0.25rem' }}
                formatter={(value, name) => [Number(value).toFixed(1), name === 'T' ? 'Temperature (K)' : 'Enthalpy']}
                labelFormatter={(label, data) => data[0]?.payload?.label || `H: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="T" 
                stroke="#f97316" 
                strokeWidth={3} 
                dot={false} 
                activeDot={{ r: 6, fill: '#f97316', stroke: '#fff' }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* h-s Diagram (Steam Cycle) */}
      <div className="bg-sys-card border border-sys-border rounded-2xl p-5 shadow-xl h-[300px] transition-colors duration-300">
        <h3 className="text-sm font-semibold text-steam mb-4 flex items-center justify-between">
          <span>h-s Diagram (Rankine)</span>
          <span className="text-xs text-sys-muted bg-sys-bg px-2 py-1 rounded-md border border-sys-border">Steam Cycle</span>
        </h3>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={outputs.steamChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis 
                dataKey="s" 
                type="number" 
                domain={[0, 8]} 
                stroke={axisColor}
                tick={{fill: axisColor, fontSize: 12}}
                label={{ value: 'Entropy s (kJ/kg.K)', position: 'insideBottom', offset: -5, fill: axisColor, fontSize: 12 }}
              />
              <YAxis 
                dataKey="h" 
                stroke={axisColor}
                tick={{fill: axisColor, fontSize: 12}}
                label={{ value: 'Enthalpy h (kJ/kg)', angle: -90, position: 'insideLeft', fill: axisColor, fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '0.5rem' }}
                itemStyle={{ color: '#0ea5e9' }}
                labelStyle={{ color: axisColor, marginBottom: '0.25rem' }}
                formatter={(value, name) => [Number(value).toFixed(1), name === 'h' ? 'Enthalpy (kJ/kg)' : 'Entropy']}
                labelFormatter={(label, data) => data[0]?.payload?.label || `s: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="h" 
                stroke="#0ea5e9" 
                strokeWidth={3} 
                dot={false} 
                activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff' }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ThermoCharts;
