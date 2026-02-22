import { useState, useMemo } from 'react';

// Thermodynamic Constants
const Cp_air = 1.005; // kJ/kg.K
const k_air = 1.4;
const R_air = 0.287; // kJ/kg.K
const v_water = 0.001; // m^3/kg approx for liquid water

/**
 * Simplified strict steam property calculator
 * Uses empirical correlations roughly tracking IAPWS-IF97 for saturation
 * P in kPa, T in K
 */
const getSteamProps = (P_kPa) => {
  const P_mmHg = P_kPa * 7.50062;
  let A, B, C;
  
  // Choose Antoine constants for water based on pressure
  if (P_kPa < 101.325) {
    // 1 to 100 deg C
    A = 8.07131; B = 1730.63; C = 233.426;
  } else {
    // 99 to 374 deg C
    A = 8.14019; B = 1810.94; C = 244.485;
  }

  const log10P = Math.log10(P_mmHg);
  const Tsat_C = B / (A - log10P) - C;
  const Tsat_K = Tsat_C + 273.15;

  // Enthalpy approx (kJ/kg)
  // Specific heat of liquid water is roughly 4.18 kJ/kg.K
  const h_f = 4.18 * Tsat_C; 
  // Heat of vaporization (h_fg) roughly linearly decreases from 2500 at 0C to 0 at critical point (374C)
  // Better linear fit around typical operating ranges:
  let h_fg = 2500 - 2.37 * Tsat_C;
  if (h_fg < 0) h_fg = 0;
  const h_g = h_f + h_fg;

  // Entropy approx (kJ/kg.K)
  const s_f = 4.18 * Math.log(Tsat_K / 273.15);
  const s_fg = h_fg / Tsat_K;
  const s_g = s_f + s_fg;

  return { Tsat_K, h_f, h_g, s_f, s_g };
};

export const useSimulation = (initialInputs) => {
  const [inputs, setInputs] = useState(initialInputs || {
    // Gas Cycle Parameters
    rp: 12, // Compressor pressure ratio
    t1: 300, // Ambient Temp (K)
    t3: 1300, // Turbine inlet temp (K)
    eta_c: 0.85, // Compressor efficiency
    eta_t: 0.88, // Gas Turbine efficiency
    lhv_biogas: 50000,
    m_dot_gas: 10,

    // Steam Cycle Parameters
    p_boiler: 10000, // kPa
    p_condenser: 10, // kPa
    eta_pump: 0.8, // Pump efficiency
    eta_steam_t: 0.85, // Steam Turbine efficiency
    t_steam_superheat: 500, // C -> 773.15K
    m_dot_steam: 5,

    // HTC
    t_htc: 200, // C
  });

  const outputs = useMemo(() => {
    try {
      // --- GAS CYCLE (Brayton) ---
      const T1 = inputs.t1;
      const rp = inputs.rp;
      const T3 = inputs.t3;
      const k = k_air;
      const Cp = Cp_air;
      
      // 1. Compressor
      const T2s = T1 * Math.pow(rp, (k - 1) / k);
      const T2 = T1 + (T2s - T1) / inputs.eta_c;
      const Wc = Cp * (T2 - T1);
      
      // 2. Combustion
      const Qin_gas = Cp * (T3 - T2);
      
      // 3. Turbine
      const T4s = T3 * Math.pow(1 / rp, (k - 1) / k);
      const T4 = T3 - inputs.eta_t * (T3 - T4s);
      const Wt = Cp * (T3 - T4);
      
      // 4. Net Work
      const Wnet_gas = Wt - Wc;
      const eta_gas = Wnet_gas / Qin_gas;

      // Gas Cycle State Points
      // State 1
      const H1 = Cp * T1;
      const s1 = 1.0; // Ref
      // State 2
      const H2 = Cp * T2;
      const s2 = s1 + Cp * Math.log(T2 / T1) - R_air * Math.log(rp);
      // State 3
      const H3 = Cp * T3;
      const s3 = s2 + Cp * Math.log(T3 / T2);
      // State 4
      const H4 = Cp * T4;
      const s4 = s3 + Cp * Math.log(T4 / T3) - R_air * Math.log(1 / rp);

      // Gas Heat Rejection
      const Qout_gas = H4 - H1;

      // VALIDATION
      const isValid = (Wt > Wc) && (T3 > T2) && (T4 < T3) && (inputs.p_boiler > inputs.p_condenser);

      if (!isValid) {
        return { isValid: false, errorMessage: "Invalid Thermodynamic State" };
      }

      // --- STEAM CYCLE (Rankine) ---
      const Pb = inputs.p_boiler;
      const Pc = inputs.p_condenser;
      
      const props_cond = getSteamProps(Pc);
      const props_boil = getSteamProps(Pb);

      // 1. Pump (State 5 -> 6)
      const h5 = props_cond.h_f; // Sat liquid at condenser pressure
      const s5 = props_cond.s_f;
      const T5 = props_cond.Tsat_K;
      const Wp = v_water * (Pb - Pc);
      const Wp_actual = Wp / inputs.eta_pump;
      const h6 = h5 + Wp_actual;
      // Approx T6 = T5 + dT from pump work (dT = dh/Cp_water, roughly 4.18)
      const T6 = T5 + Wp_actual / 4.18;
      const s6 = s5; // Pump assumed roughly isentropic for diagram purposes, actual entropy increases slightly

      // 2. Boiler (State 6 -> 7)
      const T7 = inputs.t_steam_superheat + 273.15;
      // We need h7 and s7. For superheated steam, we'll use a specific heat approx.
      // Cp_steam ~ 2.1 kJ/kg.K
      const Cp_st = 2.1;
      const h7 = props_boil.h_g + Cp_st * (T7 - props_boil.Tsat_K);
      const s7 = props_boil.s_g + Cp_st * Math.log(T7 / props_boil.Tsat_K);
      
      const Qin_steam = h7 - h6;

      // 3. Steam Turbine (State 7 -> 8)
      // Isentropic expansion to Pc. Find quality x8s at Pc using s7.
      // s7 = s_f(Pc) + x8s * s_fg(Pc)
      const x8s = (s7 - props_cond.s_f) / (props_cond.s_g - props_cond.s_f);
      
      let h8s;
      let T8s = props_cond.Tsat_K;
      if (x8s <= 1.0) {
        // Wet steam
        h8s = props_cond.h_f + x8s * (props_cond.h_g - props_cond.h_f);
      } else {
        // Still superheated (unlikely but possible with high T7 and low PR)
        // Back-calculate T8s using Cp_st
        T8s = props_cond.Tsat_K * Math.exp((s7 - props_cond.s_g)/Cp_st);
        h8s = props_cond.h_g + Cp_st * (T8s - props_cond.Tsat_K);
      }

      // Actual state 8
      const h8 = h7 - inputs.eta_steam_t * (h7 - h8s);
      const Wt_steam = h7 - h8;

      // Find actual T8 and s8 for the table
      let T8 = props_cond.Tsat_K;
      let s8 = s7;
      let x8 = (h8 - props_cond.h_f) / (props_cond.h_g - props_cond.h_f);
      if (x8 <= 1.0) {
         s8 = props_cond.s_f + x8 * (props_cond.s_g - props_cond.s_f);
      } else {
         T8 = props_cond.Tsat_K + (h8 - props_cond.h_g)/Cp_st;
         s8 = props_cond.s_g + Cp_st * Math.log(T8 / props_cond.Tsat_K);
      }

      const Qout_steam = h8 - h5;

      // 4. Steam Net Work
      const Wnet_steam = Wt_steam - Wp_actual;
      const eta_steam = Wnet_steam / Qin_steam;


      // --- COMBINED CYCLE ---
      const Wnet_total_spec = Wnet_gas + Wnet_steam * (inputs.m_dot_steam / inputs.m_dot_gas); // Specific relative to gas mass flow
      
      const power_gas = Wnet_gas * inputs.m_dot_gas; // kW
      const power_steam = Wnet_steam * inputs.m_dot_steam; // kW
      const total_power = power_gas + power_steam; // kW
      
      const heat_rate_gas = Qin_gas * inputs.m_dot_gas;
      const heat_rate_steam = Qin_steam * inputs.m_dot_steam;
      const total_heat_in = heat_rate_gas + heat_rate_steam;
      
      const overall_efficiency = total_power / total_heat_in;


      // --- ENERGY BALANCE DIAGNOSTIC ---
      // For each cycle: Qin - Qout - Wnet approx 0
      const e_bal_gas = Qin_gas - Qout_gas - Wnet_gas;
      const e_bal_steam = Qin_steam - Qout_steam - Wnet_steam;
      const gas_imbalance_pct = Math.abs(e_bal_gas / Qin_gas) * 100;
      const steam_imbalance_pct = Math.abs(e_bal_steam / Qin_steam) * 100;
      const hasWarning = (gas_imbalance_pct > 5) || (steam_imbalance_pct > 5);


      // --- CHART DATA ---
      // Gas T-H
      // Points mapped structurally without fake curves
      const gasChartData = [
        { state: '1', H: H1.toFixed(1), T: T1.toFixed(1), label: 'Compressor Inlet' },
        { state: '2', H: H2.toFixed(1), T: T2.toFixed(1), label: 'Combustor Inlet' },
        { state: '3', H: H3.toFixed(1), T: T3.toFixed(1), label: 'Turbine Inlet' },
        { state: '4', H: H4.toFixed(1), T: T4.toFixed(1), label: 'Exhaust' },
      ];

      // Steam h-s
      // Points mapped structurally without fake curves
      const steamChartData = [
        { state: '5', s: s5.toFixed(4), h: h5.toFixed(1), label: 'Pump Inlet' },
        { state: '6', s: s6.toFixed(4), h: h6.toFixed(1), label: 'Boiler Inlet' },
        { state: '7', s: s7.toFixed(4), h: h7.toFixed(1), label: 'Turbine Inlet' },
        { state: '8', s: s8.toFixed(4), h: h8.toFixed(1), label: 'Condenser Inlet' },
      ];

      // State Table Data
      const stateTableData = [
        { point: '1 (Gas)', T: T1.toFixed(1), P: '100', h: H1.toFixed(1), s: s1.toFixed(4) },
        { point: '2 (Gas)', T: T2.toFixed(1), P: (100 * rp).toFixed(0), h: H2.toFixed(1), s: s2.toFixed(4) },
        { point: '3 (Gas)', T: T3.toFixed(1), P: (100 * rp).toFixed(0), h: H3.toFixed(1), s: s3.toFixed(4) },
        { point: '4 (Gas)', T: T4.toFixed(1), P: '100', h: H4.toFixed(1), s: s4.toFixed(4) },
        { point: '5 (Steam)', T: T5.toFixed(1), P: Pc.toFixed(0), h: h5.toFixed(1), s: s5.toFixed(4) },
        { point: '6 (Steam)', T: T6.toFixed(1), P: Pb.toFixed(0), h: h6.toFixed(1), s: s6.toFixed(4) },
        { point: '7 (Steam)', T: T7.toFixed(1), P: Pb.toFixed(0), h: h7.toFixed(1), s: s7.toFixed(4) },
        { point: '8 (Steam)', T: T8.toFixed(1), P: Pc.toFixed(0), h: h8.toFixed(1), s: s8.toFixed(4) },
      ];

      return {
        isValid: true,
        // Gas
        T1, T2, T3, T4,
        W_c: Wc, W_t: Wt, W_net_gas: Wnet_gas, eta_th_gas: eta_gas, Q_in_gas: Qin_gas,
        // Steam
        W_p: Wp_actual, W_t_steam: Wt_steam, W_net_steam: Wnet_steam, eta_th_steam: eta_steam, Q_in_steam: Qin_steam,
        // Overall
        power_gas, power_steam, total_power, overall_efficiency, total_heat_in,
        // Diagnostics
        e_bal_gas, e_bal_steam, gas_imbalance_pct, steam_imbalance_pct, hasWarning,
        // Data
        gasChartData, steamChartData, stateTableData
      };

    } catch (e) {
      console.error(e);
      return { isValid: false, errorMessage: `JS Error: ${e.message}` };
    }
  }, [inputs]);

  const updateInput = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: Number(value) }));
  };

  return { inputs, outputs, updateInput };
};
