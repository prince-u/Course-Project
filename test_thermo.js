const cp = 1.005;
const k = 1.4;
const R = 0.287;

const t1 = 300;
const rp = 5;
const t3 = 1480;
const eta_c = 0.85;
const eta_t = 0.88;

const t2s = t1 * Math.pow(rp, (k - 1) / k);
const t2 = t1 + (t2s - t1) / eta_c;
const wc = cp * (t2 - t1);

const t4s = t3 * Math.pow(1 / rp, (k - 1) / k);
const t4 = t3 - eta_t * (t3 - t4s);
const wt = cp * (t3 - t4);

const isValid = (wt > wc) && (t3 > t2) && (t4 < t3);

console.log({
  t1, rp, t3, 
  t2s, t2, wc, 
  t4s, t4, wt,
  wt_gt_wc: wt > wc,
  t3_gt_t2: t3 > t2,
  t4_lt_t3: t4 < t3,
  isValid
});

const getSteamProps = (P_kPa) => {
  const P_mmHg = P_kPa * 7.50062;
  let A, B, C;
  if (P_kPa < 101.325) {
    A = 8.07131; B = 1730.63; C = 233.426;
  } else {
    A = 8.14019; B = 1810.94; C = 244.485;
  }

  const log10P = Math.log10(P_mmHg);
  const Tsat_C = B / (A - log10P) - C;
  const Tsat_K = Tsat_C + 273.15;
  const h_f = 4.18 * Tsat_C; 
  let h_fg = 2500 - 2.37 * Tsat_C;
  if (h_fg < 0) h_fg = 0;
  const h_g = h_f + h_fg;
  const s_f = 4.18 * Math.log(Tsat_K / 273.15);
  const s_fg = h_fg / Tsat_K;
  const s_g = s_f + s_fg;
  return { Tsat_K, h_f, h_g, s_f, s_g };
};

console.log("props_cond: ", getSteamProps(10));
console.log("props_boil: ", getSteamProps(5000));
