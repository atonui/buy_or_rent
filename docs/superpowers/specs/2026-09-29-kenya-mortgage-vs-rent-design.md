# Kenya mortgage versus rent calculator — design

## Purpose and scope

Build a public, mobile-friendly website for someone in Kenya comparing the purchase of a specific home with renting a comparable home over a mortgage period. The initial term is 15 years, but the user can edit it. Show both total cash paid and ending net wealth with equal prominence. All suggested inputs remain editable. The first release uses a reviewed, dated data file rather than live integrations or accounts.

Success means a visitor can enter a property price and comparable monthly rent, inspect and adjust all other assumptions, understand the two results and their components, and identify which inputs are observed Kenyan figures versus illustrative scenarios.

## Page and interaction

- A concise introduction states the comparison period and explains that results are scenarios rather than a lender quotation.
- Prominent editable inputs: purchase price, comparable monthly rent, loan term, deposit percentage, annual mortgage rate. A reset action restores suggestions.
- Two equal result cards: cumulative cash paid by each path, and ending net wealth of each path. Show differences without hiding either path.
- A year-by-year chart displays cumulative cash outlays and ending assets/wealth, with a tab or legend making units and series clear. A breakdown displays deposit, purchase costs, principal, interest, owner running costs, rent, home value, selling costs, and renter investment balance.
- Expandable assumptions: annual rent growth, property appreciation, investment return, annual maintenance and insurance, acquisition costs, sale costs. Each field has units, allowed range, and an explanation. Suggested values show source title, reporting period, link and review date, or the label “Illustrative assumption.”
- Sources panel explains the difference between a national statistic and a quote for this property. Rent and purchase price must be supplied by the user or be visibly labeled example figures. No location preset is necessary in the first release.
- Inputs update results immediately. Validate impossible or nonfinite values inline; do not display misleading output for invalid input. The layout works on phone and desktop and remains usable with keyboard and screen reader.

## Calculation model

Use monthly periods, nominal Kenya shillings, and one fixed annual mortgage rate for the full term in the first release. Convert annual nominal mortgage rate to monthly rate by dividing by 12. For loan principal `P = price × (1 − deposit fraction)`, `n = term years × 12`, and monthly rate `r`, payment is `P × r / (1 − (1+r)^−n)`; at zero rate, payment is `P/n`. Amortize month by month, cap the final principal payment to the balance, and retain interest and principal separately. Do not count principal again as an additional cash expense.

At month zero, owner cash paid includes deposit and acquisition costs. The renter invests that same amount as the initial alternative capital; a refundable rental deposit is omitted from both cash and wealth in version one. Each month, owner cash outlay includes mortgage payment plus maintenance and insurance, while renter cash outlay includes that month's rent. Rent increases at each 12-month boundary by the annual growth assumption. Maintenance and insurance are specified as annual percentages of initial purchase price, held constant in nominal terms for clarity.

Renter investment balance accrues monthly at the effective monthly rate `(1+annual return)^(1/12)−1`. At the end of each month, add `owner outlay − renter outlay`: positive differences are invested, negative differences are withdrawn. A negative balance represents the renter's cumulative funding shortfall and accrues at the same modeled rate; label this simplification in the methodology. This sets equal monthly housing budgets for both paths, including the month-zero capital. The home value grows at `(1+annual appreciation)^(1/12)` each month. At the comparison date, owner net wealth is home value less sale costs and remaining mortgage balance. Renter net wealth is the investment balance. Sale costs are included in ending wealth, not in cumulative cash paid, because no sale cash flow is assumed during the period. When the horizon exceeds the loan term, mortgage payments cease and the balance remains zero.

Use a single comparison horizon equal to the selected mortgage term for version one. Total cash paid is a gross, nominal cash-flow measure; net wealth is the modeled exit position. These are separate views and should not be subtracted from each other. Explain that a variable loan rate, tax effects, investment taxes/fees, rental moving costs, renovations, and inflation-adjusted values are outside the first release. Do not claim forecast certainty or personalized financial advice.

## Data and provenance

A small versioned data module contains each suggested value, its unit, provenance type (`observed` or `illustrative`), source URL, period, review date and explanation. The UI must not imply an observed market rate applies to every borrower. Use CBK's most recent verified mortgage survey figure for the default rate if it is the latest mortgage-specific observation available during implementation; cite the annual report and its period. KNBS Residential Property Price Index and KBA Housing Price Index can inform the context for appreciation, but extrapolating past changes is an illustrative forward assumption, clearly marked. General bank lending rates are not mortgage rates. No national rent figure will be inferred for a particular home. Purchase price and rent example values are visibly illustrative until the visitor edits them.

Review the current source documents and exact numbers during implementation before freezing the curated file. Do not silently substitute an outdated or general lending rate for a mortgage-specific rate. Each update to figures should retain source and review metadata. No backend fetch, scraping, user account, data collection, or saved server-side scenario is required.

## Architecture and verification

Build as a static Site with a pure calculation module, separate curated data module, and a responsive page. Keep scenario state in the browser for immediate recomputation; no personal data leaves the browser. Accessible chart labels and a textual numeric breakdown convey the results without relying on color. Include a copyable scenario link only if its encoded inputs are validated and contain no private information; otherwise omit it from the first release.

Unit tests cover zero-rate amortization, final balance, month-zero capital parity, monthly investment differences, rent step increases, zero-growth cases, and invalid inputs. Check the outputs against an independently calculated hand example, then run the production build and inspect the mobile and desktop experience. Publish only after the implementation plan and its reviews are complete.
