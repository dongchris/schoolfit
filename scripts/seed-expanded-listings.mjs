import fs from "node:fs/promises";

const DATA_FILE = new URL("../data/candidates.json", import.meta.url);
const now = new Date().toISOString();

const expandedListings = [
  listingCandidate({
    id: "pa-2330-emerson",
    address: "2330 Emerson St",
    city: "Palo Alto",
    zip: "94301",
    beds: 3,
    baths: 2,
    sqft: 1692,
    lot: "5,600 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/2330-Emerson-St-Palo-Alto-CA-94301/19497377_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "pa-3609-south",
    address: "3609 South Ct",
    city: "Palo Alto",
    zip: "94306",
    beds: 3,
    baths: 2,
    sqft: 1175,
    lot: "6,160 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/3609-South-Ct-Palo-Alto-CA-94306/19503069_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "pa-860-marshall",
    address: "860 Marshall Dr",
    city: "Palo Alto",
    zip: "94303",
    beds: 3,
    baths: 2,
    sqft: 1493,
    lot: "7,156 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/860-Marshall-Dr-Palo-Alto-CA-94303/19499750_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "la-151-lyell",
    address: "151 Lyell St",
    city: "Los Altos",
    zip: "94022",
    beds: 3,
    baths: 2,
    sqft: 1200,
    lot: "7,500 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/151-Lyell-St-Los-Altos-CA-94022/19526108_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "cu-10619-nathanson",
    address: "10619 Nathanson Ave",
    city: "Cupertino",
    zip: "95014",
    beds: 3,
    baths: 2,
    sqft: 1852,
    lot: "8,176 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/10619-Nathanson-Ave-Cupertino-CA-95014/19626748_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "cu-7733-lilac",
    address: "7733 Lilac Way",
    city: "Cupertino",
    zip: "95014",
    beds: 4,
    baths: 2,
    sqft: 1635,
    lot: "6,600 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/7733-Lilac-Way-Cupertino-CA-95014/19634573_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "mv-3397-ivan",
    address: "3397 Ivan Way",
    city: "Mountain View",
    zip: "94040",
    beds: 3,
    baths: 2,
    sqft: 1932,
    lot: "8,034 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/3397-Ivan-Way-Mountain-View-CA-94040/19534654_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "mv-1515-miramonte",
    address: "1515 Miramonte Ave",
    city: "Mountain View",
    zip: "94040",
    beds: 4,
    baths: 2,
    sqft: 1490,
    lot: "6,534 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/1515-Miramonte-Ave-Mountain-View-CA-94040/19532974_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "mv-801-rebecca",
    address: "801 Rebecca Privada",
    city: "Mountain View",
    zip: "94040",
    beds: 3,
    baths: 2,
    sqft: 1703,
    lot: "3,800 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/801-Rebecca-Privada-Mountain-View-CA-94040/19536645_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "sm-226-fremont",
    address: "226 N Fremont St",
    city: "San Mateo",
    zip: "94401",
    beds: 4,
    baths: 3,
    sqft: 3020,
    lot: "8,350 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/226-N-Fremont-St-San-Mateo-CA-94401/15523064_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "sm-453-26th",
    address: "453 26th Ave",
    city: "San Mateo",
    zip: "94403",
    beds: 3,
    baths: 2,
    sqft: 1907,
    lot: "5,215 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/453-26th-Ave-San-Mateo-CA-94403/15536242_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "sm-2044-lexington",
    address: "2044 Lexington Ave",
    city: "San Mateo",
    zip: "94402",
    beds: 3,
    baths: 2,
    sqft: 1656,
    lot: "7,590 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/2044-Lexington-Ave-San-Mateo-CA-94402/15541940_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "sc-1385-elm",
    address: "1385 Elm St",
    city: "San Carlos",
    zip: "94070",
    beds: 3,
    baths: 2,
    sqft: 1760,
    lot: "6,110 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/1385-Elm-St-San-Carlos-CA-94070/15562075_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "sc-875-buckland",
    address: "875 Buckland Ave",
    city: "San Carlos",
    zip: "94070",
    beds: 4,
    baths: 3,
    sqft: 2223,
    lot: "7,200 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/875-Buckland-Ave-San-Carlos-CA-94070/15550218_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "sc-948-alameda",
    address: "948 Alameda De Las Pulgas",
    city: "San Carlos",
    zip: "94070",
    beds: 3,
    baths: 3,
    sqft: 2327,
    lot: "5,500 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/948-Alameda-De-Las-Pulgas-San-Carlos-CA-94070/15557945_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "bm-416-middle",
    address: "416 Middle Rd",
    city: "Belmont",
    zip: "94002",
    beds: 4,
    baths: 3,
    sqft: 2429,
    lot: "7,986 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/416-Middle-Rd-Belmont-CA-94002/15548512_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "bm-2945-san-juan",
    address: "2945 San Juan Blvd",
    city: "Belmont",
    zip: "94002",
    beds: 4,
    baths: 2,
    sqft: 1640,
    lot: "8,725 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/2945-San-Juan-Blvd-Belmont-CA-94002/15546072_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "bm-1336-academy",
    address: "1336 Academy Ct",
    city: "Belmont",
    zip: "94002",
    beds: 4,
    baths: 4,
    sqft: 3190,
    lot: "9,123 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/1336-Academy-Ct-Belmont-CA-94002/15549080_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "lg-16371-aztec",
    address: "16371 Aztec Ridge Dr",
    city: "Los Gatos",
    zip: "95030",
    beds: 5,
    baths: 5,
    sqft: 5484,
    lot: "2.03 acre lot",
    sourceUrl: "https://www.zillow.com/homedetails/16371-Aztec-Ridge-Dr-Los-Gatos-CA-95030/19750941_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "lg-141-serra",
    address: "141 Serra Ct",
    city: "Los Gatos",
    zip: "95032",
    beds: 5,
    baths: 3,
    sqft: 2403,
    lot: "8,038 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/141-Serra-Ct-Los-Gatos-CA-95032/19749173_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "lg-102-palo-colorado",
    address: "102 Palo Colorado Dr",
    city: "Los Gatos",
    zip: "95032",
    beds: 5,
    baths: 5,
    sqft: 3368,
    lot: "0.26 acre lot",
    sourceUrl: "https://www.zillow.com/homedetails/102-Palo-Colorado-Dr-Los-Gatos-CA-95032/325806477_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  }),
  listingCandidate({
    id: "lg-87-college",
    address: "87 College Ave",
    city: "Los Gatos",
    zip: "95030",
    beds: 4,
    baths: 4,
    sqft: 2868,
    lot: "10,400 sq ft lot",
    sourceUrl: "https://www.zillow.com/homedetails/87-College-Ave-Los-Gatos-CA-95030/54771873_zpid?utm_source=chatgpt.com&utm_campaign=gptconnector"
  })
];

const feed = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
const existingIds = new Set(feed.candidates.map((candidate) => candidate.id));
const additions = expandedListings.filter((candidate) => !existingIds.has(candidate.id));

feed.candidates.push(...additions);
feed.metadata = {
  ...feed.metadata,
  generatedAt: now,
  listingFilters:
    "Single-family homes, at least 3 beds and 2 baths, Palo Alto / Los Altos / Cupertino / Mountain View / Hillsborough / San Mateo / San Carlos / Belmont / Los Gatos",
  statusText:
    "Expanded listing geography and lowered the default bath filter to 2. New Zillow-sourced listing candidates are staged until attendance-boundary assignments are resolved."
};

await fs.writeFile(DATA_FILE, `${JSON.stringify(feed, null, 2)}\n`);
console.log(`Added ${additions.length} expanded listing candidates.`);

function listingCandidate({ id, address, city, zip, beds, baths, sqft, lot, sourceUrl }) {
  return {
    id,
    address,
    city,
    zip,
    neighborhood: "Assignment pending",
    beds,
    baths,
    sqft,
    lot,
    homeType: "Single family",
    daysOnMarket: null,
    listedAt: null,
    listing: {
      provider: "zillow",
      priceLabel: "Open listing to verify",
      sourceUrl
    },
    schools: {
      elementary: [],
      middle: [],
      high: []
    },
    assignmentNotes: [
      "School assignments are pending. Resolve attendance boundaries before treating this listing as eligible."
    ],
    luxuryNotes: [
      "Expanded search candidate",
      "3+ beds",
      "2+ baths"
    ],
    provenance:
      "Listing facts came from a Zillow connector search on May 3, 2026 using 3+ beds, 2+ baths, single-family filters. Asking price, days on market, photos, and school assignments are pending."
  };
}
