import fs from "node:fs/promises";

const DATA_FILE = new URL("../data/candidates.json", import.meta.url);
const now = new Date().toISOString();

const records = {
  "pa-690-lincoln": {
    askingPrice: 3980000,
    daysOnMarket: 7,
    marketStatus: "active",
    mls: "ML82045155",
    zestimate: 4402900,
    zestimateRange: [4007000, 4887000]
  },
  "cu-10185-stonydale": {
    askingPrice: 4000000,
    daysOnMarket: 5,
    marketStatus: "active",
    mls: "ML82043195",
    zestimate: 3914100,
    zestimateRange: [3718000, 4110000]
  },
  "cu-10517-manzanita": {
    askingPrice: 5595000,
    daysOnMarket: 18,
    marketStatus: "active",
    mls: "ML82045067",
    zestimate: 6139400,
    zestimateRange: [5832000, 6508000]
  },
  "la-50-los-altos": {
    askingPrice: 3998000,
    daysOnMarket: 6,
    marketStatus: "active",
    mls: "ML82045280",
    zestimate: 4327000,
    zestimateRange: [4111000, 4543000]
  },
  "la-595-springer": {
    askingPrice: 7488000,
    daysOnMarket: 4,
    marketStatus: "active",
    mls: "ML82045176",
    zestimateStatus: "unavailable",
    zestimateLabel: "Zestimate unavailable",
    zestimateNote: "Zillow returned no Zestimate for this active listing."
  },
  "la-928-altos-oaks": {
    askingPrice: 5080000,
    daysOnMarket: 8,
    marketStatus: "active",
    mls: "ML82045107",
    zestimate: 5007400,
    zestimateRange: [4757000, 5258000]
  },
  "pa-649-seneca": {
    askingPrice: 5250000,
    daysOnMarket: 4,
    marketStatus: "active",
    mls: "ML82045242",
    zestimate: 5192300,
    zestimateRange: [4933000, 5452000]
  },
  "pa-1027-waverley": {
    askingPrice: 16980000,
    daysOnMarket: 27,
    marketStatus: "active",
    mls: "ML82041060",
    zestimate: 16255800,
    zestimateRange: [15443000, 17069000]
  },
  "cu-21075-greenleaf": {
    askingPrice: 4280000,
    daysOnMarket: 14,
    marketStatus: "active",
    mls: "ML82044311",
    zestimate: 4693700,
    zestimateRange: [4271000, 5210000]
  },
  "hb-3000-ralston": {
    askingPrice: 88000000,
    daysOnMarket: 230,
    marketStatus: "active",
    mls: "ML82024133",
    zestimate: 77638200,
    zestimateRange: [72204000, 83073000]
  },
  "mv-202-monroe": {
    askingPrice: 5595000,
    daysOnMarket: 2,
    marketStatus: "active",
    mls: "ML82045500",
    zestimateStatus: "unavailable",
    zestimateLabel: "Zestimate unavailable",
    zestimateNote: "Current listing is a to-be-built/new-construction record; automated estimates are not exposed for the active listing."
  },
  "mv-806-emily": {
    askingPrice: 3288000,
    daysOnMarket: 20,
    marketStatus: "active",
    mls: "ML82043894",
    zestimate: 3616500,
    zestimateRange: [3436000, 3797000]
  },
  "hb-1407-carlton": {
    askingPrice: 3500000,
    daysOnMarket: 39,
    marketStatus: "active",
    mls: "ML82040479",
    zestimate: 3547600,
    zestimateRange: [3370000, 3725000]
  },
  "pa-2330-emerson": {
    askingPrice: 3598000,
    daysOnMarket: 3,
    marketStatus: "active",
    mls: "ML82045214",
    zestimate: 3525600,
    zestimateRange: [3349000, 3702000]
  },
  "pa-3609-south": {
    askingPrice: 2798000,
    daysOnMarket: 2,
    marketStatus: "active",
    mls: "ML82045284",
    zestimate: 2765800,
    zestimateRange: [2489000, 3098000]
  },
  "pa-860-marshall": {
    askingPrice: 3195000,
    daysOnMarket: 2,
    marketStatus: "active",
    mls: "ML82045249",
    zestimate: 3211000,
    zestimateRange: [3050000, 3372000]
  },
  "la-151-lyell": {
    askingPrice: 3151000,
    daysOnMarket: 5,
    marketStatus: "active",
    mls: "ML82045167",
    zestimate: 3129400,
    zestimateRange: [2973000, 3286000]
  },
  "cu-10619-nathanson": {
    askingPrice: 2995000,
    daysOnMarket: 2,
    marketStatus: "active",
    mls: "426122179",
    imageUrl: "https://photos.zillowstatic.com/fp/b9787836ae7b2fd5519a2825858d2a17-cc_ft_960.jpg",
    imageSource: "Zillow listing photo",
    zestimate: 3296200,
    zestimateRange: [3131000, 3494000]
  },
  "cu-7733-lilac": {
    askingPrice: 2898000,
    daysOnMarket: 29,
    marketStatus: "active",
    mls: "ML82043192",
    zestimate: 3229400,
    zestimateRange: [3068000, 3391000]
  },
  "mv-3397-ivan": {
    askingPrice: 3198000,
    daysOnMarket: 4,
    marketStatus: "active",
    mls: "ML82045274",
    zestimate: 2906300,
    zestimateRange: [2645000, 3197000]
  },
  "mv-1515-miramonte": {
    askingPrice: 2699000,
    daysOnMarket: 67,
    marketStatus: "active",
    mls: "41125051",
    imageUrl: "https://photos.zillowstatic.com/fp/5348cbd36e54871a2cfe331a476e40c6-cc_ft_960.jpg",
    imageSource: "Zillow listing photo",
    zestimate: 2663500,
    zestimateRange: [2530000, 2797000],
    priceNote: "Price cut to $2,699,000 on April 21, 2026."
  },
  "mv-801-rebecca": {
    askingPrice: 2150000,
    daysOnMarket: 26,
    marketStatus: "active",
    mls: "ML82043363",
    zestimate: 2131700,
    zestimateRange: [2025000, 2238000]
  },
  "sm-226-fremont": {
    askingPrice: 1598000,
    daysOnMarket: 13,
    marketStatus: "active",
    mls: "ML82044463",
    zestimate: 1838800,
    zestimateRange: [1710000, 1968000]
  },
  "sm-453-26th": {
    askingPrice: 2095000,
    daysOnMarket: 2,
    marketStatus: "active",
    mls: "ML82045318",
    zestimate: 2353000,
    zestimateRange: [2165000, 2541000]
  },
  "sm-2044-lexington": {
    askingPrice: 2498000,
    daysOnMarket: 2,
    marketStatus: "active",
    mls: "ML82044883",
    zestimate: 2476300,
    zestimateRange: [2352000, 2600000],
    priceNote: "Coldwell Banker shows this as active and just listed."
  },
  "sc-1385-elm": {
    askingPrice: 1249950,
    daysOnMarket: 88,
    marketStatus: "active",
    mls: "ML82033475",
    zestimate: 1444100,
    zestimateRange: [1372000, 1516000]
  },
  "sc-875-buckland": {
    askingPrice: 2698000,
    daysOnMarket: 1,
    marketStatus: "active",
    mls: "ML82045198",
    zestimateStatus: "unavailable",
    zestimateLabel: "Zestimate unavailable",
    zestimateNote: "The active Zillow listing page shows Zestimate as not available."
  },
  "sc-948-alameda": {
    askingPrice: 2295000,
    daysOnMarket: 3,
    marketStatus: "active",
    mls: "ML82045221",
    zestimate: 2608400,
    zestimateRange: [2426000, 2817000]
  },
  "bm-416-middle": {
    askingPrice: 2398000,
    daysOnMarket: 4,
    marketStatus: "active",
    mls: "ML82045102",
    zestimate: 2386300,
    zestimateRange: [2267000, 2506000]
  },
  "bm-2945-san-juan": {
    askingPrice: 1198000,
    daysOnMarket: 6,
    marketStatus: "active",
    mls: "ML82044867",
    zestimate: 1385100,
    zestimateRange: [1288000, 1482000]
  },
  "bm-1336-academy": {
    askingPrice: 3288000,
    daysOnMarket: 2,
    marketStatus: "active",
    mls: "ML82045467",
    zestimate: 3233700,
    zestimateRange: [3072000, 3395000]
  },
  "lg-16371-aztec": {
    askingPrice: 6298000,
    daysOnMarket: 41,
    marketStatus: "active",
    mls: "ML82039380",
    zestimate: 6020100,
    zestimateRange: [5719000, 6321000]
  },
  "lg-141-serra": {
    askingPrice: 3398000,
    daysOnMarket: 6,
    marketStatus: "active",
    mls: "ML82044860",
    zestimate: 3322500,
    zestimateRange: [3156000, 3489000]
  },
  "lg-102-palo-colorado": {
    askingPrice: null,
    daysOnMarket: null,
    marketStatus: "offMarket",
    mls: "ML81860547",
    imageUrl: "https://ssl.cdn-redfin.com/photo/10/bigphoto/547/ML81860547_0.jpg",
    imageSource: "Redfin historical listing photo",
    zestimate: 4126500,
    zestimateRange: [3879000, 4457000],
    priceLabel: "Off market",
    priceNote: "Redfin shows this home as off market, sold April 2022."
  },
  "lg-87-college": {
    askingPrice: 2950000,
    daysOnMarket: 3,
    marketStatus: "active",
    mls: "ML82045128",
    zestimate: 3243900,
    zestimateRange: [3082000, 3406000]
  }
};

const feed = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
let askingCount = 0;
let photoCount = 0;
let zestimateCount = 0;
let unavailableZestimateCount = 0;

for (const candidate of feed.candidates) {
  const record = records[candidate.id];
  if (!record) {
    continue;
  }

  candidate.daysOnMarket = record.daysOnMarket;
  candidate.listing = candidate.listing ?? {};
  candidate.listing.marketStatus = record.marketStatus;
  candidate.listing.mlsNumber = record.mls;
  candidate.listing.enrichedAt = now;

  if (Number.isFinite(record.askingPrice)) {
    candidate.listing.askingPrice = record.askingPrice;
    candidate.listing.priceLabel = formatUsd(record.askingPrice);
    candidate.listing.priceSource = "Indexed listing page";
    askingCount += 1;
  } else {
    delete candidate.listing.askingPrice;
    candidate.listing.priceLabel = record.priceLabel ?? "Asking price unavailable";
  }

  if (record.priceNote) {
    candidate.listing.priceNote = record.priceNote;
  } else {
    delete candidate.listing.priceNote;
  }

  const imageUrl = record.imageUrl ?? (record.mls?.startsWith("ML") ? imageUrlForMls(record.mls) : null);
  if (imageUrl) {
    candidate.listing.imageUrl = imageUrl;
    candidate.listing.imageSource = record.imageSource ?? "Coldwell Banker / CRMLS public listing image CDN";
    candidate.listing.imageSourceUrl = imageUrl;
    photoCount += 1;
  }

  if (Number.isFinite(record.zestimate)) {
    candidate.listing.zestimate = record.zestimate;
    candidate.listing.zestimateLabel = formatUsd(record.zestimate);
    candidate.listing.zestimateRange = record.zestimateRange;
    candidate.listing.zestimateSource = "Zillow Zestimate tool";
    candidate.listing.zestimateStatus = "available";
    zestimateCount += 1;
  } else {
    delete candidate.listing.zestimate;
    delete candidate.listing.zestimateRange;
    candidate.listing.zestimateLabel = record.zestimateLabel ?? "Zestimate unavailable";
    candidate.listing.zestimateSource = "Zillow";
    candidate.listing.zestimateStatus = record.zestimateStatus ?? "unavailable";
    unavailableZestimateCount += 1;
  }

  if (record.zestimateNote) {
    candidate.listing.zestimateNote = record.zestimateNote;
  } else {
    delete candidate.listing.zestimateNote;
  }

  candidate.provenance = buildProvenance(candidate);
}

feed.metadata.generatedAt = now;
feed.metadata.listingMediaEnrichedAt = now;
feed.metadata.listingAskingPriceCandidates = askingCount;
feed.metadata.listingPhotoCandidates = photoCount;
feed.metadata.zestimateCandidates = zestimateCount;
feed.metadata.zestimateUnavailableCandidates = unavailableZestimateCount;
feed.metadata.activeForSaleCandidates = feed.candidates.filter((candidate) => {
  return candidate.listing?.marketStatus === "active" && Number.isFinite(candidate.listing?.askingPrice);
}).length;
feed.metadata.hiddenMarketCandidates = feed.candidates.length - feed.metadata.activeForSaleCandidates;
feed.metadata.statusText =
  `${feed.metadata.activeForSaleCandidates} active listings loaded with asking prices, photos, and ${zestimateCount} Zestimates. ` +
  `GreatSchools score verification is current for ${feed.metadata.greatSchoolsVerifiedSchools ?? "all"} schools.`;
feed.metadata.listingCoverageText =
  "Showing active listings with an asking price. Listing details come from Zillow, Redfin, Coldwell Banker, and public MLS image metadata; Zestimates are shown when available. Use MLS/IDX for complete live coverage.";

await fs.writeFile(DATA_FILE, `${JSON.stringify(feed, null, 2)}\n`);

console.log(`Enriched ${feed.candidates.length} candidates.`);
console.log(`Asking prices: ${askingCount}`);
console.log(`Photos: ${photoCount}`);
console.log(`Zestimates: ${zestimateCount}`);
console.log(`Unavailable Zestimates: ${unavailableZestimateCount}`);

function imageUrlForMls(mls) {
  const digits = mls.replace(/^ML/i, "");
  const path = digits.match(/.{1,2}/g).join("/");
  return `https://images-listings.coldwellbanker.com/CRMLS/ML/${path}/_P/${mls}_P00.jpg?width=1000`;
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function buildProvenance(candidate) {
  const assignmentText = candidate.assignmentStatus === "listing-source"
    ? "School assignments came from listing-source school sections."
    : "School assignments came from listing school data.";
  const listingText = candidate.listing.marketStatus === "offMarket"
    ? "Market status is currently marked off market from indexed listing pages."
    : "Asking price, photo, and market status come from listing pages and public MLS image metadata.";
  const zestimateText = candidate.listing.zestimateStatus === "available"
    ? "Zestimate values were pulled from Zillow's Zestimate tool."
    : "Zestimate is marked unavailable where Zillow did not expose a supported current Zestimate.";

  return `Listing facts were sourced on May 3, 2026. ${listingText} ${assignmentText} School Test Score percentiles were verified from GreatSchools public profiles where scoreStatus is verified. ${zestimateText}`;
}
