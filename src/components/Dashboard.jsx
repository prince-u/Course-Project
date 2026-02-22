import React, { useRef, useEffect } from 'react';
import { useSimulation } from '../hooks/useSimulation';
import ControlPanel from './ControlPanel';
import MetricsPanel from './MetricsPanel';
import ProcessDiagram from './ProcessDiagram';
import ThermoCharts from './ThermoCharts';
import { Activity, Download, Settings, Sun, Moon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Dashboard = () => {
  const { inputs, outputs, updateInput } = useSimulation();
  const dashboardRef = useRef();
  const [isAdvanced, setIsAdvanced] = React.useState(false);
  const [isDark, setIsDark] = React.useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleDownload = () => {
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();

      // Title
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('AD-HTC Power Plant Simulator Report', 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${date}`, 14, 30);

      // Inputs Table
      autoTable(doc, {
        startY: 40,
        head: [['Parameter', 'Value', 'Unit', 'Cycle']],
        body: [
          ['Pressure Ratio (rp)', inputs.rp, '-', 'Gas'],
          ['Turbine Inlet Temp (T3)', inputs.t3, 'K', 'Gas'],
          ['Compressor Eff.', inputs.eta_c, '-', 'Gas'],
          ['Turbine Eff.', inputs.eta_t, '-', 'Gas'],
          ['Boiler Pressure', inputs.p_boiler, 'kPa', 'Steam'],
          ['HTC Reactor Temp', inputs.t_htc, '°C', 'Biomass'],
          ['Condenser Pressure', inputs.p_condenser, 'kPa', 'Steam'],
          ['Steam Turbine Eff.', inputs.eta_steam_t, '-', 'Steam']
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }
      });

      // Outputs Table
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Performance Metric', 'Value', 'Unit']],
        body: [
          ['Overall System Efficiency', (outputs.overall_efficiency * 100).toFixed(2), '%'],
          ['Total Net Power', (outputs.total_power / 1000).toFixed(2), 'MW'],
          ['Gas Cycle Work Output', (outputs.power_gas / 1000).toFixed(2), 'MW'],
          ['Steam Cycle Work Output', (outputs.power_steam / 1000).toFixed(2), 'MW'],
          ['Gas Cycle Thermal Eff.', (outputs.eta_th_gas * 100).toFixed(2), '%'],
          ['Compressor Work In', (outputs.W_c || 0).toFixed(2), 'kJ/kg'],
          ['Gas Turbine Work Out', (outputs.W_t || 0).toFixed(2), 'kJ/kg'],
          ['Heat In (Qin_gas)', (outputs.Q_in_gas || 0).toFixed(2), 'kJ/kg']
        ],
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] }
      });

      doc.save('AD-HTC-Simulation-Data-Report.pdf');
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-sys-bg p-4 text-sys-text font-sans selection:bg-biomass selection:text-sys-bg transition-colors duration-300">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 p-4 bg-sys-card rounded-2xl border border-sys-border shadow-lg transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-biomass/20 rounded-lg">
            <Activity className="w-6 h-6 text-biomass" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-biomass via-gas to-steam bg-clip-text text-transparent">
              AD-HTC Power Plant Simulator
            </h1>
            <p className="text-sm text-sys-muted">Digital Twin for Fuel-Enhanced Combined Cycle</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAdvanced(!isAdvanced)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-300 ${isAdvanced ? 'bg-gas/20 text-gas border-gas shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-sys-card hover:bg-sys-border border-sys-border text-sys-muted'}`}
          >
            <span className="text-sm font-medium">{isAdvanced ? 'Advanced Mode' : 'Basic Mode'}</span>
          </button>
          <button 
            onClick={() => setIsDark(!isDark)}
            className="flex items-center justify-center p-2 rounded-lg bg-sys-bg border border-sys-border hover:bg-sys-border transition"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-sys-muted" /> : <Moon className="w-5 h-5 text-sys-muted" />}
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-sys-card hover:bg-sys-border border border-sys-border rounded-lg transition-all duration-300"
          >
            <Download className="w-4 h-4 text-steam" />
            <span className="text-sm font-medium">Export PDF</span>
          </button>
          <button className="flex flex-col items-center justify-center p-2 rounded-lg bg-sys-bg border border-sys-border hover:bg-sys-border transition">
            <Settings className="w-5 h-5 text-sys-muted" />
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main ref={dashboardRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        
        {/* Left Column: Process Flow & Controls */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-sys-card rounded-2xl border border-sys-border p-6 shadow-xl relative overflow-hidden h-[550px] md:h-[700px] w-full transition-colors duration-300">
            <div className="absolute top-4 left-4 flex gap-2 z-10">
              <span className="px-3 py-1 text-xs font-semibold bg-biomass/10 text-biomass rounded-full border border-biomass/20">Process Flow</span>
              <span className="px-3 py-1 text-xs font-semibold bg-gas/10 text-gas rounded-full border border-gas/20">Gas Cycle</span>
              <span className="px-3 py-1 text-xs font-semibold bg-steam/10 text-steam rounded-full border border-steam/20">Steam Cycle</span>
            </div>
            
            {outputs.isValid ? (
              <ProcessDiagram outputs={outputs} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-red-500 bg-red-500/5 rounded-2xl border border-red-500/20">
                <Activity className="w-16 h-16 mb-4 animate-pulse opacity-80" />
                <h2 className="text-2xl font-bold tracking-tight">Invalid Thermodynamic State</h2>
                <p className="text-sys-muted mt-2 max-w-md text-center bg-sys-bg p-4 rounded border border-sys-border">
                  The current parameters violate first-principle engineering constraints 
                  (e.g., Compressor Work strictly exceeds Turbine Work, or Temp bounds are inverted).
                </p>
              </div>
            )}
          </div>

          <ControlPanel inputs={inputs} updateInput={updateInput} isAdvanced={isAdvanced} />
        </div>

        {/* Right Column: Thermodynamic Charts & Metrics */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {outputs.isValid && (
            <>
              <MetricsPanel outputs={outputs} />
              <ThermoCharts outputs={outputs} isDark={isDark} />
            </>
          )}
        </div>

        {/* Full Width: State Tables & Diagnostics */}
        {outputs.isValid && (
          <div className="lg:col-span-12 flex flex-col gap-6 mt-6">
            <div className="bg-sys-card border border-sys-border rounded-2xl p-6 shadow-xl transition-colors duration-300 overflow-x-auto">
              <h3 className="text-lg font-semibold text-sys-text mb-4">Thermodynamic State Points Table</h3>
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-sys-bg text-sys-muted">
                  <tr>
                    <th className="p-3 font-semibold rounded-tl-lg">State Point</th>
                    <th className="p-3 font-semibold">Temperature (K)</th>
                    <th className="p-3 font-semibold">Pressure (kPa)</th>
                    <th className="p-3 font-semibold">Enthalpy h (kJ/kg)</th>
                    <th className="p-3 font-semibold rounded-tr-lg">Entropy s (kJ/kg.K)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sys-border text-sys-text">
                  {outputs.stateTableData && outputs.stateTableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-sys-bg/50 transition-colors">
                      <td className={`p-3 font-medium ${row.point.includes('Gas') ? 'text-gas' : 'text-steam'}`}>{row.point}</td>
                      <td className="p-3 font-mono">{row.T}</td>
                      <td className="p-3 font-mono">{row.P}</td>
                      <td className="p-3 font-mono">{row.h}</td>
                      <td className="p-3 font-mono">{row.s}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Energy Balance Check */}
            <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors duration-300 ${outputs.hasWarning ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' : 'bg-green-500/10 border-green-500/50 text-green-400'}`}>
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-black/20">
                   <Activity className="w-5 h-5" />
                 </div>
                 <div>
                   <h4 className="font-semibold text-sm">Energy Balance Diagnostic (1st Law Check)</h4>
                   <p className="text-xs opacity-80 mt-1">Gas Cycle Imbalance: {outputs.gas_imbalance_pct?.toFixed(3)}% | Steam Cycle Imbalance: {outputs.steam_imbalance_pct?.toFixed(3)}%</p>
                 </div>
               </div>
               <div className="font-mono text-sm px-3 py-1 bg-black/20 rounded">
                 Σ (Q_in - Q_out - W_net) ≈ 0
               </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
