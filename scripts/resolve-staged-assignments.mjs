import fs from "node:fs/promises";

const DATA_FILE = new URL("../data/candidates.json", import.meta.url);
const now = new Date().toISOString();

const assignments = {
  "pa-2330-emerson": {
    sourceUrl: "https://www.redfin.com/CA/Palo-Alto/2330-Emerson-St-94301/home/1021482",
    elementary: ["Walter Hays Elementary School", "K-5", "Palo Alto Unified"],
    middle: ["Frank S. Greene Jr. Middle School", "6-8", "Palo Alto Unified"],
    high: ["Palo Alto High School", "9-12", "Palo Alto Unified"]
  },
  "pa-3609-south": {
    sourceUrl: "https://www.redfin.com/CA/Palo-Alto/3609-South-Ct-94306/home/1541109",
    elementary: ["Fairmeadow Elementary School", "K-5", "Palo Alto Unified"],
    middle: ["Jane Lathrop Stanford Middle School", "6-8", "Palo Alto Unified"],
    high: ["Henry M. Gunn High School", "9-12", "Palo Alto Unified"]
  },
  "pa-860-marshall": {
    sourceUrl: "https://www.realtor.com/realestateandhomes-detail/860-Marshall-Dr_Palo-Alto_CA_94303_M25396-12277",
    elementary: ["Palo Verde Elementary School", "K-5", "Palo Alto Unified"],
    middle: ["Jane Lathrop Stanford Middle School", "6-8", "Palo Alto Unified"],
    high: ["Palo Alto High School", "9-12", "Palo Alto Unified"]
  },
  "la-151-lyell": {
    sourceUrl: "https://www.redfin.com/CA/Los-Altos/151-Lyell-St-94022/home/1432363",
    elementary: ["Covington Elementary School", "K-6", "Los Altos Elementary"],
    middle: ["Ardis G. Egan Junior High School", "7-8", "Los Altos Elementary"],
    high: ["Los Altos High School", "9-12", "Mountain View-Los Altos Union High"]
  },
  "cu-10619-nathanson": {
    sourceUrl: "https://www.redfin.com/CA/Cupertino/10619-Nathanson-Ave-95014/home/1673711",
    elementary: ["Garden Gate Elementary School", "K-5", "Cupertino Union"],
    middle: ["Sam H. Lawson Middle School", "6-8", "Cupertino Union"],
    high: ["Monta Vista High School", "9-12", "Fremont Union High"]
  },
  "cu-7733-lilac": {
    sourceUrl: "https://www.redfin.com/CA/Cupertino/7733-Lilac-Way-95014/home/1313651",
    elementary: ["Abraham Lincoln Elementary School", "K-5", "Cupertino Union"],
    middle: ["John F. Kennedy Middle School", "6-8", "Cupertino Union"],
    high: ["Monta Vista High School", "9-12", "Fremont Union High"],
    notes: ["Listing portals disagree on the elementary school for this address; Redfin/listing text shows Lincoln, while a SchoolDigger syndication page shows Regnart. Verify district boundary before treating this as final."]
  },
  "mv-3397-ivan": {
    sourceUrl: "https://www.redfin.com/CA/Mountain-View/3397-Ivan-Way-94040/home/1281180",
    elementary: ["Amy Imai Elementary", "K-5", "Mountain View Whisman"],
    middle: ["Isaac Newton Graham Middle School", "6-8", "Mountain View Whisman"],
    high: ["Mountain View High School", "9-12", "Mountain View-Los Altos Union High"]
  },
  "mv-1515-miramonte": {
    sourceUrl: "https://www.redfin.com/CA/Mountain-View/1515-Miramonte-Ave-94040/home/1057580",
    elementary: ["Benjamin Bubb Elementary School", "K-5", "Mountain View Whisman"],
    middle: ["Isaac Newton Graham Middle School", "6-8", "Mountain View Whisman"],
    high: ["Mountain View High School", "9-12", "Mountain View-Los Altos Union High"]
  },
  "mv-801-rebecca": {
    sourceUrl: "https://www.redfin.com/CA/Mountain-View/801-Rebecca-Privada-94040/home/649411",
    elementary: ["Amy Imai Elementary", "K-5", "Mountain View Whisman"],
    middle: ["Isaac Newton Graham Middle School", "6-8", "Mountain View Whisman"],
    high: ["Mountain View High School", "9-12", "Mountain View-Los Altos Union High"]
  },
  "sm-226-fremont": {
    sourceUrl: "https://www.redfin.com/CA/San-Mateo/226-N-Fremont-St-94401/home/1973068",
    elementary: ["Baywood Elementary School", "K-5", "San Mateo-Foster City"],
    middle: ["Borel Middle School", "6-8", "San Mateo-Foster City"],
    high: ["San Mateo High School", "9-12", "San Mateo Union High"]
  },
  "sm-453-26th": {
    sourceUrl: "https://www.zillow.com/homedetails/453-26th-Ave-San-Mateo-CA-94403/15536242_zpid/",
    elementary: ["Beresford Elementary School", "K-5", "San Mateo-Foster City"],
    middle: ["Abbott Middle School", "6-8", "San Mateo-Foster City"],
    high: ["Hillsdale High School", "9-12", "San Mateo Union High"]
  },
  "sm-2044-lexington": {
    sourceUrl: "https://www.redfin.com/CA/San-Mateo/2044-Lexington-Ave-94402/home/1230126",
    elementary: ["Highlands Elementary School", "K-5", "San Mateo-Foster City"],
    middle: ["Borel Middle School", "6-8", "San Mateo-Foster City"],
    high: ["Aragon High School", "9-12", "San Mateo Union High"]
  },
  "sc-1385-elm": {
    sourceUrl: "https://www.zillow.com/homedetails/1385-Elm-St-San-Carlos-CA-94070/15562075_zpid/",
    elementary: ["White Oaks Elementary School", "K-3", "San Carlos Elementary"],
    middle: ["Central Middle School", "6-8", "San Carlos Elementary"],
    high: ["Sequoia High School", "9-12", "Sequoia Union High"],
    notes: ["San Carlos has a K-3 plus 4-5 upper-elementary pathway. Arroyo Upper Elementary appears in source results as the nearby 4-5 continuation and should be modeled separately."]
  },
  "sc-875-buckland": {
    sourceUrl: "https://www.realty.com/home-listings/1058941560/875-Buckland-Avenue-San-Carlos-CA-94070",
    elementary: ["Arundel Elementary School", "K-3", "San Carlos Elementary"],
    middle: ["Tierra Linda Middle School", "6-8", "San Carlos Elementary"],
    high: ["Carlmont High School", "9-12", "Sequoia Union High"],
    notes: ["San Carlos has a K-3 plus 4-5 upper-elementary pathway. Mariposa Upper Elementary appears in source results as the 4-5 continuation and should be modeled separately."]
  },
  "sc-948-alameda": {
    sourceUrl: "https://www.zillow.com/homedetails/948-Alameda-De-Las-Pulgas-San-Carlos-CA-94070/15557945_zpid/",
    elementary: ["Heather Elementary School", "K-3", "San Carlos Elementary"],
    middle: ["Tierra Linda Middle School", "6-8", "San Carlos Elementary"],
    high: ["Carlmont High School", "9-12", "Sequoia Union High"],
    notes: ["San Carlos has a K-3 plus 4-5 upper-elementary pathway. The upper-elementary continuation should be verified with district boundary data."]
  },
  "bm-416-middle": {
    sourceUrl: "https://www.trulia.com/home/416-middle-rd-belmont-ca-94002-15548512",
    elementary: ["Central Elementary School", "K-5", "Belmont-Redwood Shores"],
    middle: ["Ralston Intermediate School", "6-8", "Belmont-Redwood Shores"],
    high: ["Carlmont High School", "9-12", "Sequoia Union High"]
  },
  "bm-2945-san-juan": {
    sourceUrl: "https://www.redfin.com/CA/Belmont/2945-San-Juan-Blvd-94002/home/2014456",
    elementary: ["Cipriani Elementary School", "K-5", "Belmont-Redwood Shores"],
    middle: ["Ralston Intermediate School", "6-8", "Belmont-Redwood Shores"],
    high: ["Carlmont High School", "9-12", "Sequoia Union High"]
  },
  "bm-1336-academy": {
    sourceUrl: "https://www.redfin.com/CA/Belmont/1336-Academy-Ave-94002/home/1122735",
    elementary: ["Central Elementary School", "K-5", "Belmont-Redwood Shores"],
    middle: ["Ralston Intermediate School", "6-8", "Belmont-Redwood Shores"],
    high: ["Carlmont High School", "9-12", "Sequoia Union High"]
  },
  "lg-16371-aztec": {
    sourceUrl: "https://www.redfin.com/CA/Los-Gatos/16371-Aztec-Ridge-Dr-95030/home/1373866",
    elementary: ["Louise Van Meter Elementary School", "K-5", "Los Gatos Union Elementary"],
    middle: ["Raymond J. Fisher Middle School", "6-8", "Los Gatos Union Elementary"],
    high: ["Los Gatos High School", "9-12", "Los Gatos-Saratoga Joint Union High"]
  },
  "lg-141-serra": {
    sourceUrl: "https://www.redfin.com/CA/Los-Gatos/141-Serra-Ct-95032/home/1650147",
    elementary: ["Louise Van Meter Elementary School", "K-5", "Los Gatos Union Elementary"],
    middle: ["Raymond J. Fisher Middle School", "6-8", "Los Gatos Union Elementary"],
    high: ["Los Gatos High School", "9-12", "Los Gatos-Saratoga Joint Union High"]
  },
  "lg-102-palo-colorado": {
    sourceUrl: "https://www.redfin.com/CA/Los-Gatos/102-Palo-Colorado-Dr-95032/home/172955225",
    elementary: ["Alta Vista Elementary School", "K-5", "Union Elementary"],
    middle: ["Union Middle School", "6-8", "Union Elementary"],
    high: ["Leigh High School", "9-12", "Campbell Union High"]
  },
  "lg-87-college": {
    sourceUrl: "https://www.redfin.com/CA/Los-Gatos/87-College-Ave-95030/home/1489246",
    elementary: ["Louise Van Meter Elementary School", "K-5", "Los Gatos Union Elementary"],
    middle: ["Raymond J. Fisher Middle School", "6-8", "Los Gatos Union Elementary"],
    high: ["Los Gatos High School", "9-12", "Los Gatos-Saratoga Joint Union High"]
  }
};

const feed = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
let updated = 0;

for (const candidate of feed.candidates) {
  const assignment = assignments[candidate.id];
  if (!assignment) {
    continue;
  }

  candidate.schools = {
    elementary: [school(assignment.elementary, assignment.sourceUrl)],
    middle: [school(assignment.middle, assignment.sourceUrl)],
    high: [school(assignment.high, assignment.sourceUrl)]
  };
  candidate.assignmentSource = "Listing school information";
  candidate.assignmentSourceUrl = assignment.sourceUrl;
  candidate.assignmentStatus = "listing-source";
  candidate.assignmentVerifiedAt = now;
  candidate.assignmentNotes = [
    "Assigned schools came from listing-source school sections and still need district-boundary confirmation.",
    ...(assignment.notes ?? [])
  ];
  candidate.provenance =
    "Listing facts came from a Zillow connector search on May 3, 2026. School assignments came from listing-source school sections; GreatSchools Test Score percentiles are verified separately where scoreStatus is verified. District attendance boundaries still need independent confirmation.";
  updated += 1;
}

feed.metadata = {
  ...feed.metadata,
  generatedAt: now,
  assignmentSourceMode: "listing-source",
  listingFeedMode: "staged",
  assignmentResolvedAt: now,
  assignmentResolvedCandidates: updated,
  listingCoverageText:
    "Current records are a staged listing sample. School assignments come from listing-source school sections, not district boundary files. Use MLS/IDX plus boundary data for a complete live market view.",
  statusText:
    "School assignments were added from listing-source school sections. District attendance-boundary confirmation is still required before buying decisions."
};

await fs.writeFile(DATA_FILE, `${JSON.stringify(feed, null, 2)}\n`);
console.log(`Resolved listing-source assignments for ${updated} candidates.`);

function school([name, grades, district], assignmentSourceUrl) {
  return {
    name,
    grades,
    district,
    assignment: "primary",
    confidence: "listing-source",
    testScorePercentile: null,
    sourceUrl: assignmentSourceUrl,
    note: "Assignment from listing-source school section",
    scoreStatus: "unverified",
    scoreVerifiedAt: null
  };
}
