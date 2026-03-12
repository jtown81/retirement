/**
 * OPM Locality Pay Rates
 *
 * Locality pay percentages applied on top of GS base pay.
 * Source: OPM Locality Pay Schedule — published annually with the GS pay table.
 * Classification: Hard regulatory requirement.
 *
 * Update process: Same cadence as gs-pay-tables.ts. OPM publishes updated
 * locality rates each December/January. See docs/regulatory-mapping.md.
 *
 * Usage: Every federal employee is assigned a locality pay area based on
 * their official duty station. The percentage here multiplies base pay.
 * Total pay = basePay × (1 + localityRate).
 *
 * IMPORTANT: LEO availability pay interacts with locality — see pay-calculator.ts.
 */

/** Locality area code → pay percentage (e.g., 0.1682 = 16.82%) */
type LocalityTable = Record<string, number>;

/**
 * 2024 OPM Locality Pay Percentages
 * Effective: January 2024
 * Source: OPM Salary Table 2024-GS
 *
 * Codes are OPM locality area identifiers. Use 'RUS' for any duty station
 * not covered by a specific locality area (Rest of U.S.).
 */
const LOCALITY_2024: LocalityTable = {
  // Rest of U.S. — fallback for any unlisted location
  RUS:           0.1682,

  // Major metro areas (alphabetical)
  ALBANY:        0.2039,  // Albany-Schenectady, NY-MA
  ALBUQUERQUE:   0.1791,  // Albuquerque-Santa Fe-Las Vegas, NM
  ATLANTA:       0.2345,  // Atlanta-Athens-Clarke County-Sandy Springs, GA-AL
  AUSTIN:        0.2060,  // Austin-Round Rock, TX
  BOSTON:        0.3192,  // Boston-Worcester-Providence, MA-RI-NH-CT-ME
  BUFFALO:       0.1920,  // Buffalo-Cheektowaga, NY
  CHARLOTTE:     0.2040,  // Charlotte-Concord, NC-SC
  CHICAGO:       0.2984,  // Chicago-Naperville-Elgin, IL-IN-WI
  CINCINNATI:    0.2071,  // Cincinnati-Wilmington-Maysville, OH-KY-IN
  CLEVELAND:     0.2201,  // Cleveland-Akron-Canton, OH
  COLORADOSPR:   0.2247,  // Colorado Springs, CO
  COLUMBUS:      0.2128,  // Columbus-Marion-Zanesville, OH
  DALLAS:        0.2656,  // Dallas-Fort Worth, TX-OK
  DAYTON:        0.2071,  // Dayton-Springfield-Kettering, OH
  DENVER:        0.2993,  // Denver-Aurora, CO
  DETROIT:       0.2774,  // Detroit-Warren-Ann Arbor, MI
  HARTFORD:      0.3017,  // Hartford-East Hartford, CT-MA
  HONOLULU:      0.2118,  // Honolulu-Urban Honolulu, HI
  HOUSTON:       0.3391,  // Houston-The Woodlands, TX
  HUNTSVILLE:    0.1955,  // Huntsville-Decatur-Albertville, AL
  INDIANAPOLIS:  0.1854,  // Indianapolis-Carmel-Muncie, IN
  JACKSONVILLE:  0.1764,  // Jacksonville, FL
  KANSASCITY:    0.1739,  // Kansas City, MO-KS
  LAREDO:        0.1793,  // Laredo, TX
  LOSANGELES:    0.3361,  // Los Angeles-Long Beach-Anaheim, CA
  LOUISVILLE:    0.1848,  // Louisville-Jefferson County-Elizabethtown-Bowlingreen, KY-IN
  MIAMI:         0.2344,  // Miami-Fort Lauderdale-West Palm Beach, FL
  MILWAUKEE:     0.1977,  // Milwaukee-Racine-Waukesha, WI
  MINNEAPOLIS:   0.2509,  // Minneapolis-St. Paul, MN-WI
  NEWORLEANS:    0.1776,  // New Orleans-Metairie-Hammond, LA-MS
  NEWYORK:       0.3506,  // New York-Newark-Jersey City, NY-NJ-CT-PA
  NORFOLK:       0.2451,  // Virginia Beach-Norfolk-Newport News, VA-NC
  OKLAHOMACITY:  0.1707,  // Oklahoma City-Shawnee, OK
  OMAHA:         0.1727,  // Omaha-Council Bluffs-Fremont, NE-IA
  ORLANDO:       0.1827,  // Orlando-Deltona-Daytona Beach, FL
  PHILADELPHIA:  0.2889,  // Philadelphia-Reading-Camden, PA-NJ-DE-MD
  PHOENIX:       0.2131,  // Phoenix-Mesa-Scottsdale, AZ
  PITTSBURGH:    0.1910,  // Pittsburgh-New Castle-Weirton, PA-OH-WV
  PORTLAND:      0.2755,  // Portland-Vancouver-Salem, OR-WA
  RALEIGH:       0.2424,  // Raleigh-Durham-Chapel Hill, NC
  RICHMOND:      0.2055,  // Richmond, VA
  SACRAMENTO:    0.3026,  // Sacramento-Roseville, CA
  SANANTONIO:    0.1840,  // San Antonio-New Braunfels-Pearsall, TX
  SANDIEGO:      0.3398,  // San Diego-Chula Vista-Carlsbad, CA
  SANFRANCISCO:  0.4415,  // San Jose-San Francisco-Oakland, CA
  SEATTLE:       0.3086,  // Seattle-Tacoma-Bellevue, WA
  STLOUIS:       0.1876,  // St. Louis-St. Charles-Farmington, MO-IL
  TUCSON:        0.1755,  // Tucson-Nogales, AZ
  WASHINGTON:    0.3326,  // Washington-Baltimore-Arlington, DC-MD-VA-WV-PA
};

/**
 * 2025 OPM Locality Pay Percentages
 * Effective: January 2025
 * Source: OPM Salary Tables 2025 (incorporating 1.7% General Schedule Increase)
 * URL: https://www.opm.gov/policy-data-oversight/pay-leave/salaries-wages/salary-tables/
 *
 * Rates verified directly from individual OPM locality table pages (XX_h.aspx).
 * New locality areas added in 2025: ALASKA, BIRMINGHAM, DAVENPORT, FRESNO,
 * HARRISBURG, RENO, ROCHESTER, SPOKANE.
 */
const LOCALITY_2025: LocalityTable = {
  // Rest of U.S. — fallback for any unlisted location
  RUS:           0.1706,

  // Major metro areas (alphabetical)
  ALBANY:        0.2077,  // Albany-Schenectady, NY-MA
  ALBUQUERQUE:   0.1833,  // Albuquerque-Santa Fe-Las Vegas, NM
  ALASKA:        0.3236,  // Alaska (statewide)
  ATLANTA:       0.2379,  // Atlanta-Athens-Clarke County-Sandy Springs, GA-AL
  AUSTIN:        0.2035,  // Austin-Round Rock, TX
  BIRMINGHAM:    0.1824,  // Birmingham-Hoover-Talladega, AL  [new 2025]
  BOSTON:        0.3258,  // Boston-Worcester-Providence, MA-RI-NH-CT-ME
  BUFFALO:       0.2241,  // Buffalo-Cheektowaga, NY
  CHARLOTTE:     0.1967,  // Charlotte-Concord, NC-SC
  CHICAGO:       0.3086,  // Chicago-Naperville-Elgin, IL-IN-WI
  CINCINNATI:    0.2193,  // Cincinnati-Wilmington-Maysville, OH-KY-IN
  CLEVELAND:     0.2223,  // Cleveland-Akron-Canton, OH
  COLORADOSPR:   0.2015,  // Colorado Springs, CO
  COLUMBUS:      0.2215,  // Columbus-Marion-Zanesville, OH
  DALLAS:        0.2726,  // Dallas-Fort Worth, TX-OK
  DAVENPORT:     0.1893,  // Davenport-Moline, IA-IL  [new 2025]
  DAYTON:        0.2142,  // Dayton-Springfield-Kettering, OH
  DENVER:        0.3052,  // Denver-Aurora, CO
  DETROIT:       0.2912,  // Detroit-Warren-Ann Arbor, MI
  FRESNO:        0.1765,  // Fresno-Madera-Hanford, CA  [new 2025]
  HARRISBURG:    0.1943,  // Harrisburg-Lebanon, PA  [new 2025]
  HARTFORD:      0.3208,  // Hartford-East Hartford, CT-MA
  HONOLULU:      0.2221,  // Honolulu-Urban Honolulu, HI
  HOUSTON:       0.3500,  // Houston-The Woodlands, TX
  HUNTSVILLE:    0.2191,  // Huntsville-Decatur-Albertville, AL
  INDIANAPOLIS:  0.1815,  // Indianapolis-Carmel-Muncie, IN
  JACKSONVILLE:  0.1945,  // Jacksonville, FL
  KANSASCITY:    0.1897,  // Kansas City, MO-KS
  LAREDO:        0.2159,  // Laredo, TX
  LOSANGELES:    0.3647,  // Los Angeles-Long Beach-Anaheim, CA
  LOUISVILLE:    0.1957,  // Louisville-Jefferson County-Elizabethtown-Bowlinggreen, KY-IN
  MIAMI:         0.2467,  // Miami-Fort Lauderdale-West Palm Beach, FL
  MILWAUKEE:     0.2242,  // Milwaukee-Racine-Waukesha, WI
  MINNEAPOLIS:   0.2762,  // Minneapolis-St. Paul, MN-WI
  NEWORLEANS:    0.1801,  // New Orleans-Metairie-Hammond, LA-MS
  NEWYORK:       0.3795,  // New York-Newark-Jersey City, NY-NJ-CT-PA
  NORFOLK:       0.1880,  // Virginia Beach-Norfolk-Newport News, VA-NC
  OKLAHOMACITY:  0.1763,  // Oklahoma City-Shawnee, OK
  OMAHA:         0.1823,  // Omaha-Council Bluffs-Fremont, NE-IA
  ORLANDO:       0.1793,  // Orlando-Deltona-Daytona Beach, FL
  PHILADELPHIA:  0.2899,  // Philadelphia-Reading-Camden, PA-NJ-DE-MD
  PHOENIX:       0.2245,  // Phoenix-Mesa-Scottsdale, AZ
  PITTSBURGH:    0.2103,  // Pittsburgh-New Castle-Weirton, PA-OH-WV
  PORTLAND:      0.2613,  // Portland-Vancouver-Salem, OR-WA
  RALEIGH:       0.2224,  // Raleigh-Durham-Cary, NC
  RENO:          0.1752,  // Reno-Fernley, NV  [new 2025]
  RICHMOND:      0.2228,  // Richmond, VA
  ROCHESTER:     0.1788,  // Rochester-Batavia-Seneca Falls, NY  [new 2025]
  SACRAMENTO:    0.2976,  // Sacramento-Roseville, CA
  SANANTONIO:    0.1878,  // San Antonio-New Braunfels-Pearsall, TX
  SANDIEGO:      0.3372,  // San Diego-Chula Vista-Carlsbad, CA
  SANFRANCISCO:  0.4634,  // San Jose-San Francisco-Oakland, CA
  SEATTLE:       0.3157,  // Seattle-Tacoma-Bellevue, WA
  SPOKANE:       0.1767,  // Spokane-Spokane Valley-Coeur d'Alene, WA-ID  [new 2025]
  STLOUIS:       0.2003,  // St. Louis-St. Charles-Farmington, MO-IL
  TUCSON:        0.1928,  // Tucson-Nogales, AZ
  WASHINGTON:    0.3394,  // Washington-Baltimore-Arlington, DC-MD-VA-WV-PA
};

/** All locality tables keyed by year */
const LOCALITY_TABLES: Record<number, LocalityTable> = {
  2024: LOCALITY_2024,
  2025: LOCALITY_2025,
};

const BASE_LOCALITY_YEAR = 2024;

/**
 * Returns the locality pay rate for a given locality code and year.
 *
 * Falls back to the most recent available table for years without an entry.
 * Falls back to the RUS (Rest of U.S.) rate for unrecognized locality codes.
 *
 * @param localityCode  OPM locality area code (e.g., 'WASHINGTON', 'RUS')
 * @param payYear       Calendar year
 */
export function getLocalityRate(localityCode: string, payYear: number): number {
  // Find the best available table: exact match or most recent prior year
  const sortedYears = Object.keys(LOCALITY_TABLES)
    .map(Number)
    .sort((a, b) => a - b);

  const tableYear = sortedYears.filter(y => y <= payYear).pop() ?? BASE_LOCALITY_YEAR;
  const table = LOCALITY_TABLES[tableYear] ?? LOCALITY_2024;

  const rate = table[localityCode.toUpperCase()];
  if (rate !== undefined) return rate;

  // Flag unrecognized locality codes; fall back to RUS
  console.warn(
    `[retire:career] Unknown locality code "${localityCode}" for ${payYear}. Using RUS rate.`,
  );
  return table['RUS'] ?? LOCALITY_2024['RUS'];
}

/** Returns all locality codes available for a given year. */
export function getAvailableLocalityCodes(payYear: number): string[] {
  const sortedYears = Object.keys(LOCALITY_TABLES).map(Number).sort((a, b) => a - b);
  const tableYear = sortedYears.filter(y => y <= payYear).pop() ?? BASE_LOCALITY_YEAR;
  return Object.keys(LOCALITY_TABLES[tableYear] ?? LOCALITY_2024);
}
