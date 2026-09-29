/* ISO 3166-1 alpha-2 → display name, for the analytics dashboard.
   ⚠️ NOT A COMPLETE LIST, AND IT DOES NOT NEED TO BE. The store ships to the
   United States only, so the tail is traffic rather than customers. Anything
   unrecognised falls back to the raw code, which is still readable — a missing
   name must never hide a row. Two non-country codes reach us from real edges
   and are named rather than dropped, because "unknown origin" is a fact worth
   seeing: XX (Vercel could not resolve) and T1 (Tor exit node). */
const NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", MX: "Mexico", GB: "United Kingdom",
  IE: "Ireland", DE: "Germany", FR: "France", ES: "Spain", IT: "Italy",
  NL: "Netherlands", BE: "Belgium", PT: "Portugal", PL: "Poland",
  SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland", CH: "Switzerland",
  AT: "Austria", CZ: "Czechia", RO: "Romania", GR: "Greece", TR: "Türkiye",
  RU: "Russia", UA: "Ukraine", IL: "Israel", AE: "UAE", SA: "Saudi Arabia",
  EG: "Egypt", MA: "Morocco", DZ: "Algeria", TN: "Tunisia", NG: "Nigeria",
  ZA: "South Africa", KE: "Kenya", IN: "India", PK: "Pakistan", BD: "Bangladesh",
  CN: "China", HK: "Hong Kong", TW: "Taiwan", JP: "Japan", KR: "South Korea",
  SG: "Singapore", MY: "Malaysia", TH: "Thailand", VN: "Vietnam",
  ID: "Indonesia", PH: "Philippines", AU: "Australia", NZ: "New Zealand",
  BR: "Brazil", AR: "Argentina", CL: "Chile", CO: "Colombia", PE: "Peru",
  PR: "Puerto Rico", DO: "Dominican Republic", GT: "Guatemala", CR: "Costa Rica",
  XX: "Unknown origin", T1: "Tor network",
};

export function countryName(code: string): string {
  return NAMES[code.toUpperCase()] ?? code.toUpperCase();
}
