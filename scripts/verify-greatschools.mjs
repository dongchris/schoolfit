import fs from "node:fs/promises";

const DATA_FILE = new URL("../data/candidates.json", import.meta.url);
const GREAT_SCHOOLS_BASE = "https://www.greatschools.org";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const CITY_SLUGS = [
  "palo-alto",
  "los-altos",
  "los-altos-hills",
  "cupertino",
  "mountain-view",
  "hillsborough",
  "san-mateo",
  "san-carlos",
  "belmont",
  "los-gatos",
  "redwood-city",
  "san-jose",
  "burlingame",
];

const now = new Date().toISOString();
const feed = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
const schoolIndex = await buildGreatSchoolsIndex();
const uniqueSchools = uniqueFeedSchools(feed);
const verifiedScores = new Map();
const misses = [];

for (const school of uniqueSchools) {
  const profile = findSchoolProfile(school, schoolIndex);

  if (!profile) {
    misses.push(`${school.name} - profile not found`);
    continue;
  }

  const sourceUrl = `${GREAT_SCHOOLS_BASE}${profile.links.profile}`;
  const rating = await readTestScoreRating(sourceUrl);

  if (!rating?.testScorePercentile) {
    misses.push(`${school.name} - Test Score percentile not exposed`);
    continue;
  }

  verifiedScores.set(normalizeSchoolName(school.name), {
    ...rating,
    greatSchoolsRating: rating.greatSchoolsRating ?? numericRating(profile.rating),
    sourceUrl,
    profileName: profile.name,
    districtName: profile.districtName,
    grades: profile.gradeLevels
  });
}

for (const candidate of feed.candidates) {
  for (const level of ["elementary", "middle", "high"]) {
    for (const school of candidate.schools[level]) {
      const verified = verifiedScores.get(normalizeSchoolName(school.name));

      if (verified) {
        school.testScorePercentile = verified.testScorePercentile;
        school.testScoreRating = verified.testScoreRating;
        school.greatSchoolsRating = verified.greatSchoolsRating;
        school.sourceUrl = `${verified.sourceUrl}#Test_scores`;
        school.scoreSource = "GreatSchools public profile RatingFactors";
        school.scoreVerifiedAt = now;
        school.scoreStatus = "verified";
        school.note = school.note?.replace("Primary assignment seed", "Primary assignment; score verified") ?? "Score verified";
      } else {
        school.scoreStatus = "unverified";
        school.scoreVerifiedAt = null;
      }
    }
  }

  const assignmentText = candidate.assignmentStatus === "listing-source"
    ? "School assignments came from listing-source school sections and still need district-boundary confirmation."
    : "Attendance-boundary assignments still need independent verification.";
  candidate.provenance =
    `Listing facts came from a Zillow connector search on May 3, 2026. ${assignmentText} School Test Score percentiles were verified from GreatSchools public profiles where scoreStatus is verified.`;
}

feed.metadata.generatedAt = now;
feed.metadata.greatSchoolsVerifiedAt = now;
feed.metadata.greatSchoolsVerifiedSchools = verifiedScores.size;
feed.metadata.greatSchoolsUnverifiedSchools = misses;
feed.metadata.schoolScoreMetric =
  "GreatSchools public profile Test Score Rating percentile, e.g. outperforms 99% of similar schools in California";
feed.metadata.statusText = `GreatSchools score verification refreshed ${verifiedScores.size}/${uniqueSchools.length} unique schools. Attendance-boundary assignments still need independent verification.`;

await fs.writeFile(DATA_FILE, `${JSON.stringify(feed, null, 2)}\n`);

console.log(`Verified ${verifiedScores.size}/${uniqueSchools.length} GreatSchools Test Score percentiles.`);
if (misses.length) {
  console.log("Unverified:");
  for (const miss of misses) {
    console.log(`- ${miss}`);
  }
}

async function buildGreatSchoolsIndex() {
  const schools = [];

  for (const citySlug of CITY_SLUGS) {
    const html = await fetchText(`${GREAT_SCHOOLS_BASE}/california/${citySlug}/`);
    const component = readReactComponent(html, "BasicDataModule");

    if (!component?.data) {
      continue;
    }

    for (const section of component.data) {
      for (const school of section.values ?? []) {
        if (school?.links?.profile && school.name) {
          schools.push(school);
        }
      }
    }
  }

  return schools;
}

async function readTestScoreRating(sourceUrl) {
  const html = await fetchText(sourceUrl);
  const component = readReactComponent(html, "RatingFactors");
  const subratings = component?.data?.subratings ?? [];
  const testScore = subratings.find((rating) => rating.title === "Test Score Rating");
  const percentMatch = testScore?.description?.match(/outperforms\s+(\d+)%/i);
  const overallMatch = html.match(/<span class="(?:rs-school-rating__number|rating-number)">\s*(\d+)\s*<\/span>/i);

  return {
    testScorePercentile: percentMatch ? Number(percentMatch[1]) : null,
    testScoreRating: numericRating(testScore?.rating),
    greatSchoolsRating: overallMatch ? Number(overallMatch[1]) : null
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });

  if (!response.ok) {
    throw new Error(`GreatSchools fetch failed ${response.status} for ${url}`);
  }

  return response.text();
}

function readReactComponent(html, componentName) {
  const pattern = new RegExp(
    `<script[^>]+data-component-name="${escapeRegExp(componentName)}"[^>]*>([\\s\\S]*?)<\\/script>`,
    "i"
  );
  const match = html.match(pattern);

  if (!match) {
    return null;
  }

  return JSON.parse(decodeHtmlEntities(match[1].trim()));
}

function uniqueFeedSchools(feedData) {
  const seen = new Map();

  for (const candidate of feedData.candidates) {
    for (const level of ["elementary", "middle", "high"]) {
      for (const school of candidate.schools[level]) {
        const key = normalizeSchoolName(school.name);
        if (!seen.has(key)) {
          seen.set(key, school);
        }
      }
    }
  }

  return [...seen.values()];
}

function findSchoolProfile(school, schools) {
  const target = normalizeSchoolName(school.name);
  const exact = schools.find((item) => normalizeSchoolName(item.name) === target);
  if (exact) {
    return exact;
  }

  return schools.find((item) => {
    const name = normalizeSchoolName(item.name);
    return name.includes(target) || target.includes(name);
  });
}

function normalizeSchoolName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bjunior\b/g, "jr")
    .replace(/\bjr\./g, "jr")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bschool\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function numericRating(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function decodeHtmlEntities(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
