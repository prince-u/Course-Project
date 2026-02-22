import React from 'react';
import { motion } from 'framer-motion';

const colorMap = {
  biomass: { fill: 'var(--color-bg)', stroke: '#22c55e', text: '#22c55e', glow: 'drop-shadow(0 0 4px rgba(34,197,94,0.4))' },
  gas: { fill: 'var(--color-bg)', stroke: '#f97316', text: '#f97316', glow: 'drop-shadow(0 0 4px rgba(249,115,22,0.4))' },
  steam: { fill: 'var(--color-bg)', stroke: '#0ea5e9', text: '#0ea5e9', glow: 'drop-shadow(0 0 4px rgba(14,165,233,0.4))' },
  dark: { fill: 'var(--color-bg)', stroke: 'currentColor', text: 'currentColor', glow: '' } // default
};

const FlowLine = ({ path, colorHex, dashed = false, animate = true }) => (
  <motion.path
    d={path}
    fill="none"
    stroke={colorHex || 'currentColor'}
    strokeWidth="2"
    strokeDasharray={dashed ? "6 6" : animate ? "8 6" : "none"}
    initial={animate ? { strokeDashoffset: 100 } : false}
    animate={animate ? { strokeDashoffset: 0 } : false}
    transition={animate ? { repeat: Infinity, ease: "linear", duration: 2 } : {}}
  />
);

const TextBox = ({ x, y, width, height, text, colorClass, onHover, id, onLeave }) => {
  const theme = colorMap[colorClass] || colorMap.dark;
  return (
    <g 
      onMouseEnter={(e) => onHover && onHover(e, id)} 
      onMouseLeave={onLeave}
      className={onHover ? "cursor-pointer transition-all duration-300 hover:brightness-125" : ""}
      style={{ filter: theme.glow }}
    >
      <rect x={x} y={y} width={width} height={height} rx="6" fill={theme.fill} stroke={theme.stroke} strokeWidth="1.5" />
      <foreignObject x={x} y={y} width={width} height={height}>
        <div xmlns="http://www.w3.org/1999/xhtml" className="flex items-center justify-center w-full h-full p-2 text-center text-[11px] font-semibold leading-tight select-none" style={{ color: theme.text }}>
          {text}
        </div>
      </foreignObject>
    </g>
  );
};

const Trapezoid = ({ x, y, width, h1, h2, label, colorClass, onHover, id, onLeave }) => {
  const theme = colorMap[colorClass] || colorMap.dark;
  const nx = Number(x);
  const ny = Number(y);
  const nw = Number(width);
  const nh1 = Number(h1);
  const nh2 = Number(h2);
  
  return (
    <g 
      onMouseEnter={(e) => onHover && onHover(e, id)} 
      onMouseLeave={onLeave}
      className={onHover ? "cursor-pointer transition-all duration-300 hover:brightness-125" : ""}
      style={{ filter: theme.glow }}
    >
      <polygon points={`${nx},${ny-nh1/2} ${nx+nw},${ny-nh2/2} ${nx+nw},${ny+nh2/2} ${nx},${ny+nh1/2}`} fill={theme.fill} stroke={theme.stroke} strokeWidth="1.5" strokeLinejoin="round" />
      <text x={nx+nw/2} y={ny+25} textAnchor="middle" fill={theme.text} fontSize="12" fontWeight="bold" className="select-none">{label}</text>
    </g>
  )
};

const ProcessDiagram = ({ outputs }) => {
  const [tooltip, setTooltip] = React.useState({ visible: false, x: 0, y: 0, title: '', data: {} });

  const handleHover = (e, id) => {
    const rect = e.target.getBoundingClientRect();
    const parentRect = e.target.closest('svg').getBoundingClientRect();
    const x = rect.left - parentRect.left + rect.width / 2;
    const y = rect.top - parentRect.top + rect.height / 2;

    let title = '';
    let data = {};

    switch(id) {
      case 'ad': title = 'Anaerobic Digester'; data = { 'Process': 'Biogas Prod.' }; break;
      case 'htc': title = 'HTC Reactor'; data = { 'Temp': `${outputs?.t_htc || 200} °C` }; break;
      case 'comp': title = 'Compressor'; data = { 'W_in': `${(outputs?.W_c || 0).toFixed(1)} kJ/kg` }; break;
      case 'cc': title = 'Biogas Combustion Chamber'; data = { 'Fuel': 'Biogas' }; break;
      case 'gt': title = 'Turbine'; data = { 'W_out': `${(outputs?.W_t || 0).toFixed(1)} kJ/kg` }; break;
      case 'boiler': title = 'Boiler'; data = { 'Steam Gen': 'Superheated' }; break;
      case 'coll': title = 'Enhanced Biogas Collector'; data = { 'Process': 'Collection' }; break;
      default: return;
    }

    setTooltip({ visible: true, x, y, title, data });
  };

  const clearHover = () => setTooltip(prev => ({ ...prev, visible: false }));

  return (
    <div className="w-full h-full relative cursor-crosshair">
      <svg width="100%" height="100%" viewBox="0 0 850 650" className="text-sys-text drop-shadow-sm font-sans" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
          <marker id="arrow-biomass" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
          </marker>
          <marker id="arrow-gas" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" />
          </marker>
           <marker id="arrow-steam" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0ea5e9" />
          </marker>
        </defs>

        {/* FLOW LINES WITH ARROWS */}
        <g strokeWidth="2" className="drop-shadow-sm">
          {/* Biomass in */}
          <g markerEnd="url(#arrow-biomass)"><FlowLine path="M 20 80 L 100 80" colorHex="#22c55e" /></g>
          
          {/* Homogenizer -> AD/Reactor (Biomass) */}
          <g markerEnd="url(#arrow-biomass)"><FlowLine path="M 200 80 L 515 80 L 515 100" colorHex="#22c55e" /></g>
          <g markerEnd="url(#arrow-biomass)"><FlowLine path="M 150 130 L 150 200 L 230 200" colorHex="#22c55e" /></g>
          
          {/* Boiler to AD (Steam to hot water) */}
          <g markerEnd="url(#arrow-steam)"><FlowLine path="M 350 100 L 490 100" colorHex="#0ea5e9" /></g>
          
          {/* Reactor <-> Boiler (HTC Steam Cycle) */}
          {/* Reactor -> Pump -> Boiler */}
          <g markerEnd="url(#arrow-steam)"><FlowLine path="M 230 180 L 210 180 L 210 110 L 260 110" colorHex="#0ea5e9" /></g>
          {/* Boiler -> Reactor Return */}
          <g markerEnd="url(#arrow-steam)"><FlowLine path="M 350 120 L 380 120 L 380 180 L 330 180" colorHex="#0ea5e9" /></g>
          
          {/* Reactor -> Junction (Biogas) */}
          <FlowLine path="M 330 200 L 390 200 L 390 170 L 440 170" colorHex="#f97316" />
          {/* AD -> Junction (Biogas) */}
          <FlowLine path="M 515 150 L 515 170 L 440 170" colorHex="#f97316" />
          {/* Junction -> Collector (Biogas) */}
          <g markerEnd="url(#arrow-gas)"><FlowLine path="M 440 170 L 440 210" colorHex="#f97316" /></g>
          
          {/* Reactor -> Waste */}
          <g markerEnd="url(#arrow-biomass)"><FlowLine path="M 280 230 L 280 280" colorHex="#22c55e" /></g>
          
          {/* Collector -> Distribution (Biogas) */}
          <g markerEnd="url(#arrow-gas)"><FlowLine path="M 480 240 L 700 240" colorHex="#f97316" /></g>
          {/* Collector -> Combustor (Biogas) */}
          <g markerEnd="url(#arrow-gas)"><FlowLine path="M 440 270 L 440 320" colorHex="#f97316" /></g>
          
          {/* Air -> Compressor */}
          <g markerEnd="url(#arrow)"><FlowLine path="M 240 600 L 240 510" animate={false} /></g>
          
          {/* Compressor -> Combustor (Gas) */}
          <g markerEnd="url(#arrow-gas)"><FlowLine path="M 310 425 L 310 345 L 360 345" colorHex="#f97316" /></g>
          
          {/* Combustor -> Turbine (Gas) */}
          <g markerEnd="url(#arrow-gas)"><FlowLine path="M 520 345 L 570 345 L 570 425" colorHex="#f97316" /></g>
          
          {/* Turbine -> Exhaust */}
          <g markerEnd="url(#arrow-gas)"><FlowLine path="M 640 510 L 640 600" colorHex="#f97316" /></g>
        </g>
        
        {/* Pump Circle and Triangle explicitly drawn over the line */}
        <g style={{ filter: colorMap.steam.glow }}>
          <circle cx="210" cy="145" r="14" fill="var(--color-bg)" stroke="#0ea5e9" strokeWidth="1.5" />
          <polygon points="210,135 202,152 218,152" fill="#0ea5e9" />
        </g>

        {/* SHAFT (dashed line) */}
        <FlowLine path="M 150 460 L 730 460" animate={false} dashed={true} />
        
        {/* Rotation Arrow on right side of shaft */}
        <g fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sys-text" style={{ filter: colorMap.dark.glow }}>
          <path d="M 710 440 A 20 20 0 1 1 710 480" markerEnd="url(#arrow)"/>
        </g>

        {/* TEXT LABELS */}
        <g fill="currentColor" fontSize="11" className="select-none text-sys-text drop-shadow-sm font-semibold">
          <text x="15" y="55" textAnchor="middle">
            <tspan x="60" dy="0">Biomass</tspan>
            <tspan x="60" dy="14">Feedstock</tspan>
          </text>
          
          <text x="440" y="70" textAnchor="middle">Moisture-rich Biomass Feedstock</text>
          <text x="155" y="240" textAnchor="middle">
            <tspan x="155" dy="0">Moisture-lean Biomass</tspan>
            <tspan x="155" dy="14">Feedstock</tspan>
          </text>
          
          <text x="190" y="150" textAnchor="end" fill="#0ea5e9">Pump</text>
          
          <text x="305" y="145" textAnchor="middle" fontSize="10" fill="#0ea5e9">HTC Steam Cycle</text>
          
          <text x="280" y="300" textAnchor="middle">
            <tspan x="280" dy="0">Volatile Matters</tspan>
            <tspan x="280" dy="14">and Feedstock Waste</tspan>
          </text>
          
          <text x="710" y="235" textAnchor="start">
            <tspan x="710" dy="0">Biogas</tspan>
            <tspan x="710" dy="14">Distribution to</tspan>
            <tspan x="710" dy="14">Building Envelopes</tspan>
          </text>

          <text x="240" y="625" textAnchor="middle">Air</text>
          <text x="640" y="625" textAnchor="middle">Exhaust Gases</text>

          {/* Title */}
          <text x="440" y="560" textAnchor="middle" fontSize="18" fontWeight="bold">AD-HTC Fuel-Enhanced</text>
          <text x="440" y="585" textAnchor="middle" fontSize="18" fontWeight="bold">Gas Power Cycle</text>
        </g>

        {/* COMPONENTS */}
        <TextBox id="homogenizer" colorClass="biomass" x="100" y="30" width="100" height="100" text="Biomass Feedstock Homogenizer" />
        <TextBox id="boiler" colorClass="steam" x="260" y="80" width="90" height="50" text="Boiler" onHover={handleHover} onLeave={clearHover} />
        <TextBox id="htc" colorClass="biomass" x="230" y="170" width="100" height="60" text="Reactor" onHover={handleHover} onLeave={clearHover} />
        <TextBox id="ad" colorClass="biomass" x="490" y="100" width="50" height="50" text="AD" onHover={handleHover} onLeave={clearHover} />
        <TextBox id="coll" colorClass="gas" x="400" y="210" width="80" height="60" text="Enhanced Biogas Collector" onHover={handleHover} onLeave={clearHover} />
        <TextBox id="cc" colorClass="gas" x="360" y="320" width="160" height="50" text="Biogas Combustion chamber" onHover={handleHover} onLeave={clearHover} />
        
        {/* Trapezoids: x, y is center of shaft */}
        <Trapezoid id="comp" colorClass="gas" x="220" y="460" width="110" h1="120" h2="60" label="Compressor" onHover={handleHover} onLeave={clearHover} />
        <Trapezoid id="gt" colorClass="gas" x="550" y="460" width="110" h1="60" h2="120" label="Turbine" onHover={handleHover} onLeave={clearHover} />

      </svg>
      
      {tooltip.visible && (
        <div 
          className="absolute z-10 bg-sys-card border border-sys-border text-sys-text p-3 rounded-lg shadow-xl pointer-events-none text-sm w-48 transition-opacity duration-200"
          style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
        >
          <h4 className="font-bold border-b border-sys-border pb-1 mb-2 text-sys-text">{tooltip.title}</h4>
          <div className="flex flex-col gap-1">
            {Object.entries(tooltip.data).map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-sys-muted">{k}</span>
                <span className="font-mono text-xs">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessDiagram;
