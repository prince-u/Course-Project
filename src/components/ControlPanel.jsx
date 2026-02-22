import React from 'react';

const InputSlider = ({ label, value, onChange, min, max, step, unit, color }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between text-sm">
      <span className="text-sys-muted">{label}</span>
      <span className={`font-mono text-${color}`}>{value} {unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full accent-${color} h-2 bg-sys-border rounded-lg appearance-none cursor-pointer`}
      style={{ accentColor: `var(--tw-colors-${color}-500, ${color === 'gas' ? '#f97316' : color === 'steam' ? '#0ea5e9' : '#22c55e'})` }}
    />
  </div>
);

const ControlPanel = ({ inputs, updateInput, isAdvanced }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Gas Cycle Controls */}
      <div className="bg-sys-card border border-sys-border rounded-2xl p-5 shadow-lg transition-colors duration-300">
        <h3 className="text-lg font-semibold text-gas mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gas glow-gas"></div>
          Gas Cycle Parameters
        </h3>
        <div className="space-y-4">
          <InputSlider label="Pressure Ratio (rp)" value={inputs.rp} onChange={(v) => updateInput('rp', v)} min={5} max={30} step={0.5} color="gas" />
          <InputSlider label="Turbine Inlet Temp" value={inputs.t3} onChange={(v) => updateInput('t3', v)} min={1000} max={1600} step={10} unit="K" color="gas" />
          {isAdvanced && (
            <>
              <InputSlider label="Compressor Eff." value={inputs.eta_c} onChange={(v) => updateInput('eta_c', v)} min={0.7} max={0.95} step={0.01} color="gas" />
              <InputSlider label="Turbine Eff." value={inputs.eta_t} onChange={(v) => updateInput('eta_t', v)} min={0.7} max={0.95} step={0.01} color="gas" />
            </>
          )}
        </div>
      </div>

      {/* Steam Cycle Controls */}
      <div className="bg-sys-card border border-sys-border rounded-2xl p-5 shadow-lg transition-colors duration-300">
        <h3 className="text-lg font-semibold text-steam mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-steam glow-steam"></div>
          Steam / HTC Parameters
        </h3>
        <div className="space-y-4">
          <InputSlider label="Boiler Pressure" value={inputs.p_boiler} onChange={(v) => updateInput('p_boiler', v)} min={5000} max={20000} step={500} unit="kPa" color="steam" />
          <InputSlider label="HTC Reactor Temp" value={inputs.t_htc} onChange={(v) => updateInput('t_htc', v)} min={180} max={250} step={5} unit="°C" color="biomass" />
          {isAdvanced && (
            <>
              <InputSlider label="Condenser Pressure" value={inputs.p_condenser} onChange={(v) => updateInput('p_condenser', v)} min={5} max={100} step={1} unit="kPa" color="steam" />
              <InputSlider label="Steam Turbine Eff." value={inputs.eta_steam_t} onChange={(v) => updateInput('eta_steam_t', v)} min={0.7} max={0.95} step={0.01} color="steam" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
