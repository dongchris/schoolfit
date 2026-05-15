# Listing Data Options

Goal: source active home candidates with asking price, list date / days on market, status, basic facts, and house photos for Palo Alto, Los Altos, Cupertino, Mountain View, Hillsborough, San Mateo, San Carlos, Belmont, Los Gatos, and nearby Bay Area cities.

## Best-fit options

### 1. MLSListings direct / RESO feed

Most relevant local source for this project. MLSListings covers Santa Clara and San Mateo counties and says its listing data is the original source for many consumer portals, refreshing every five minutes.

Expected fields:

- asking price: `ListPrice`
- listing date / status / modifications
- beds, baths, living area, lot size
- media/photos
- public remarks
- open house data, if licensed

Access shape:

- Usually requires a licensed agent, broker, brokerage, or approved vendor relationship.
- Best path is to ask a buyer agent/broker whether they can authorize IDX/VOW or back-office data access for this private tool.

Source: https://www.mlslistings.com/about-us/about-mlslistings/data

### 2. Bridge Interactive

Good engineering option if MLSListings or a brokerage can approve access through Bridge. Bridge offers a RESO Web API, normalized data, and a dashboard for requesting MLS data access.

Expected fields:

- MLS listing records normalized to RESO
- price, status, dates, property facts
- media, depending on the MLS feed and license

Access shape:

- Bridge does not grant the data by itself; the MLS/data provider must approve the license.

Source: https://www.bridgeinteractive.com/developers/bridge-api/

### 3. SimplyRETS

Practical developer wrapper once we have MLS RETS or RESO credentials. It exposes a simpler `/properties` API and normalizes common listing fields, including `listPrice`, `listDate`, address, beds/baths, etc.

Expected fields:

- asking price
- list date and active/pending/closed status depending on plan
- property facts
- photos/media from the MLS feed
- 30-minute refresh cadence on listed plans

Access shape:

- We still need RETS or RESO credentials from the MLS.
- Lowest-friction implementation if we get credentials but do not want to build a raw RESO sync pipeline immediately.

Source: https://simplyrets.com/

### 4. Repliers

Another strong developer wrapper for MLS data. Repliers advertises standardized MLS APIs, photos/media CDN, listing status, list price, price history, list date, days on market, and related fields.

Expected fields:

- list price and price history
- listing date, last updated timestamp, days on market
- property photos and virtual tours when provided
- raw MLS fields if needed

Access shape:

- Production MLS data generally requires appropriate real estate professional access / MLS agreements.
- Useful if we want a hosted API with media delivery and search features.

Sources:

- https://repliers.com/
- https://help.repliers.com/en/article/what-types-of-data-does-repliers-provide-ihcj1h/

### 5. CoreLogic / Trestle

Raw RESO Web API option. Trestle’s Property resource includes `ListPrice`, `PhotosCount`, `PhotosChangeTimestamp`, and expandable `Media`.

Expected fields:

- full RESO listing model
- price, status, postal code, modification timestamps
- media records/photos

Access shape:

- More engineering work than SimplyRETS/Repliers.
- Requires data license / access approval.

Sources:

- https://trestle-documentation.corelogic.com/
- https://api-trestle.corelogic.com/trestle/Documentation/MetaData/Resource/Property

### 6. MLS Grid

Good option if the relevant MLS participates or if a broker already has MLS Grid access. MLS Grid is designed for replicated MLS data, not direct live user-query routing. It includes Property plus expandable Media resources and requires media files to be copied/hosted by the application rather than hotlinked.

Expected fields:

- property/listing data
- media/photos via Media resource
- frequent replication updates where supported

Access shape:

- Requires subscription/license approval.
- Need a local media cache/CDN because MLS Grid says media URLs are for downloading a local copy only.

Sources:

- https://docs.mlsgrid.com/
- https://docs.mlsgrid.com/api-documentation/api-version-2.0

### 7. ListHub Syndication API

Possible if we qualify as a publisher or have access through broker/listing agreements. It is a RESO Web API and includes listing photos, but ListHub explicitly says it is not for live querying from an app; publishers must store listing data and photos locally.

Expected fields:

- `ListPrice`
- active listings via `StandardStatus`
- photos/images
- incremental sync support

Access shape:

- Publisher/broker ecosystem, not a casual public API.
- Requires local data and image storage.

Source: https://www.listhub.com/api-documentation/

## Enrichment-only options

### ATTOM

Useful for property enrichment: parcel data, tax, deed, sales history, property characteristics, neighborhood/school-related data. It is not my first choice for current active listing photos in this app.

Source: https://www.attomdata.com/solutions/api/

## Avoid as primary source

### Redfin / portal scraping APIs

Redfin’s own terms prohibit automated crawling/scraping unless there is prior express written permission. Some third-party APIs advertise Redfin/Zillow/Realtor extraction, but they are not ideal as the core data source for a home-buying product.

Use Redfin as:

- outbound source links
- manual saved-listing imports
- a provider only if we have explicit permission or a licensed partner feed

Source: https://www.redfin.com/about/terms-of-use?src=homepage

## Recommended path

1. Ask a Bay Area buyer agent or brokerage whether they can authorize MLSListings data access for a private buyer research tool.
2. If yes, choose either:
   - SimplyRETS or Repliers for faster implementation, or
   - Bridge / raw RESO for more control.
3. Cache listing media locally and store `imageUrl` as a local app URL.
4. Keep GreatSchools data separate: use GreatSchools Enterprise for exact themed ratings and school assignment/boundary data.
5. Use ATTOM only as a property-enrichment add-on if we want tax/history/parcel signals.
