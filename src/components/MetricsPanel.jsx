import React from 'react';
import { Zap, Flame, Droplets, Activity } from 'lucide-react';

const colorMaps = {
  biomass: {
    bg: 'bg-biomass/20',
    text: 'text-biomass',
    glow: 'shadow-[0_0_15px_rgba(34,197,94,0.2)]',
    border: 'border-biomass'
  },
  gas: {
    bg: 'bg-gas/20',
    text: 'text-gas',
    glow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]',
    border: 'border-gas'
  },
  steam: {
    bg: 'bg-steam/20',
    text: 'text-steam',
    glow: 'shadow-[0_0_15px_rgba(14,165,233,0.2)]',
    border: 'border-steam'
  }
};

const MetricCard = ({ title, value, unit, icon: Icon, colorClass, highlight }) => {
  const styles = colorMaps[colorClass];
  return (
    <div className={`p-4 rounded-xl border ${highlight ? `${styles.border} ${styles.glow}` : 'border-sys-border'} bg-sys-bg flex items-center gap-4 transition-colors duration-300`}>
      <div className={`p-3 rounded-lg ${styles.bg}`}>
        <Icon className={`w-6 h-6 ${styles.text}`} />
      </div>
      <div>
        <p className="text-sm text-sys-muted font-medium">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${highlight ? styles.text : 'text-sys-text'}`}>{value}</span>
          <span className="text-sm text-sys-muted">{unit}</span>
        </div>
      </div>
    </div>
  );
};

const MetricsPanel = ({ outputs }) => {
  const effPercent = (outputs.overall_efficiency * 100).toFixed(1);
  const gasEffPercent = (outputs.eta_th_gas * 100).toFixed(1);

  return (
    <div className="bg-sys-card border border-sys-border rounded-2xl p-6 shadow-xl space-y-4 transition-colors duration-300">
      <h3 className="text-lg font-semibold text-sys-text mb-2">Performance Metrics</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        <MetricCard 
          title="Overall Thermal Efficiency" 
          value={effPercent} 
          unit="%" 
          icon={Activity}
          colorClass="biomass"
          highlight={true}
        />
        <MetricCard 
          title="Total Net Power" 
          value={(outputs.total_power / 1000).toFixed(2)} 
          unit="MW" 
          icon={Zap}
          colorClass="gas"
        />
        <MetricCard 
          title="Gas Cycle Work" 
          value={(outputs.power_gas / 1000).toFixed(2)} 
          unit="MW" 
          icon={Flame}
          colorClass="gas"
        />
        <MetricCard 
          title="Steam Turbine Work" 
          value={(outputs.power_steam / 1000).toFixed(2)} 
          unit="MW" 
          icon={Droplets}
          colorClass="steam"
        />
      </div>
      
      <div className="mt-4 p-4 rounded-xl bg-sys-bg border border-sys-border transition-colors duration-300">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-sys-muted">Gas Efficiency</span>
          <span className="text-sm font-mono text-gas">{gasEffPercent}%</span>
        </div>
        <div className="w-full h-2 bg-sys-border rounded-full overflow-hidden">
          <div className="h-full bg-gas rounded-full glow-gas" style={{ width: `${gasEffPercent}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
