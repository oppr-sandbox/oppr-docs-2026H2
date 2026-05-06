oppr-business-requirements.md
Version: 0.5 Created: 30 March 2026 (as CLAUDE.md second brain) Restructured: 4 May 2026 (v0.2: company context) Reframed: 4 May 2026 (v0.3: business requirements for v1.0) Refined: 4 May 2026 (v0.4: log initiation model, asset-anchored vs asset-agnostic) Expanded: 4 May 2026 (v0.5: data quality model, intelligence ladder, knowledge graph)

Purpose: Business requirements for Oppr v1.0, defined as the version of the platform that converts an 8-week paid POC into a €75-100K annual contract on a repeatable basis. This document is the input for the technical gap analysis the engineering team runs next.

Changelog

v0.1 (30 Mar 2026): Initial CLAUDE.md as personal second brain.
v0.2 (4 May 2026): Restructured around three stakeholder lenses, five anchored use cases, the LOGS to IDA to DOCS closed loop, and the 8-week POC frame.
v0.3 (4 May 2026): Reframed as business requirements for v1.0. Locked the 7 log primitives. Locked the bronze/silver/gold data model. Decoupled asset/QR registry from projects. Added Mutares POC May ship list, SCADA/MES read-only integration, UI/UX chapter, POC kickoff readiness.
v0.4 (4 May 2026): QR scan removed as a primitive (it is an app behavior, not a log step). Reduced primitive count from 7 to 6. Added asset-anchored vs asset-agnostic log distinction. Added complete log initiation model with 6 paths.
v0.5 (4 May 2026): Restructured Section 5 around the unified timeline, Medallion data quality model (with the Oppr capture advantage), and the four-level intelligence ladder (Manual exploration, Static dashboards, Conversational intelligence, Autonomous agents). Added knowledge graph as v1.0 commitment. Added self-improving intelligence as a Level 4 enabler. Updated capabilities table and stakeholder value sections accordingly.


0. GOAL OF THIS DOCUMENT
Oppr today is a working product with one customer live (Omniplast), an 8-week paid POC with Mutares Holliday starting 1 June 2026, and a 6-month engagement with Renewi ATM Moerdijk underway. The commercial frame going forward is the 8-week paid POC at €25K converting into a €75-100K annual contract. That frame requires the platform to deliver visible, defensible value inside 8 weeks, repeatedly, across waste and recycling customers.

v1.0 is the version of the platform that makes that conversion repeatable. Target ship: end of September 2026. Roughly 4 months from today. Aggressive, achievable with internal team plus external development.

This document defines what v1.0 must do, in business terms, derived from the 5 use cases the platform must support. The technical team takes this as input, runs a gap analysis, and decides scope, sequencing, and tradeoffs.

The Mutares POC (June-July 2026) runs on a subset of v0, not v1.0. v1.0 ships after Mutares completes, and the next POC after that is the first one running on full v1.0.


1. WHAT OPPR IS
One-liner
Oppr is the Human Data Layer for Manufacturing. We capture frontline operator knowledge through voice, photo, and structured input, fuse it with machine and external data on a unified timeline, and apply AI to drive continuous improvement that operators, process engineers, and operations managers all benefit from.
The core thesis
Machines tell you WHAT happened. Operators know WHY.

Factories have spent decades automating data capture from sensors, SCADA, and MES. They have ignored the most advanced sensor in any plant: the operator. The operator knows that the feed looks wetter today, that the pump has been vibrating for a week, that the valve runs hotter since the last cleaning. That knowledge currently walks out the door every shift change, every retirement, every sick day. Oppr captures it, structures it, and feeds it back into the operation.
The structural gap (ISA-95)
The ISA-95 standard organizes manufacturing systems into five levels: ERP at L4, MES at L3, SCADA/PLC at L2/L1, physical process at L0. Roughly 93% of manufacturers use ISA-95 in some form. The standard assumes data flows upward from sensors. It has no model for human-generated context. Oppr sits across L0 to L3 and adds the human data layer that ISA-95 never accounted for.

2. THE TWO SYSTEMS
Oppr consists of two systems that work together but are sold separately.
System 1: Oppr Insights (Discovery)
Standalone PLG product. Asynchronous multilingual voice-first idea capture. AI structures loose inputs into prioritized starting points. Answers "where should we focus our improvement efforts?"

v1.0 status: OUT OF SCOPE. Insights already exists as a working tool. It is not part of the 8-week POC. It will integrate with the execution platform later. Mentioned here so it is not forgotten, not for v1.0 inclusion.
System 2: The Execution Platform (the focus of this document)
Three modules in a continuous improvement cycle:

LOGS (Capture) → IDA (Investigate) → DOCS (Standardize) ↑ │ └──────────────────────────────────────────┘ Closed improvement loop 

LOGS produces structured operator data. IDA finds patterns and answers questions. DOCS turns validated patterns into living standards. Operators follow the standards, capture new observations through LOGS, and the loop continues.

Continuous improvement never ends. The platform is not "finished" once initial issues are resolved. Phase 1 finds low-hanging fruit. Phase 2 sustains and scales. Phase 3 deepens, expands, protects against regression. Oppr is the operating execution platform that keeps the loop running.


3. CURRENT STATE (HONEST ASSESSMENT)
LOGS — Capture
Status: General Availability. Mobile app shipping. Self-service log builder shipping. Floor plan and asset list shipping. Scheduled rounds and notifications shipping. One customer live (Omniplast).

What works today:

Multimodal capture: voice notes (transcribed on the phone), photos, structured forms.
Self-service log configurator: drag-and-drop log step builder.
Floor plan and asset registry per project.
Round = sequence of stations. Station = asset + log.
Scheduled rounds with phone notifications to operators.
HMI template capture: guided photo capture with field-level extraction.
Numeric primitive with min/max validation and units.
Per-project dashboard with configurable graphs and basic KPI math.

What does not work today:

Voice audio storage. Today the phone transcribes and the text is stored. The audio is likely discarded (must confirm with tech team).
Asset/QR registry shared across projects. Today scoped to a single project.
Sign-off as a dedicated primitive. Today operators type their name in a text field.
Connection from logs to documents.
Scan-time disambiguation when one QR maps to multiple logs (e.g., same machine appears in a quality round and a maintenance round).
IDA — Investigate
Status: MVP. Desktop only. Reactive chat over LOGS data and uploaded external data.

What works today:

Conversational query over manually uploaded external data.
Cross-analysis between captured and uploaded data inside one session.
One-off analyses, hypothesis testing, ad-hoc reports.

What does not work today:

Conversational query over LOGS data.
Operator-facing IDA in the mobile app.
Knowledge graph: no structured representation of plant context (asset relationships, sequences, dependencies). IDA reasons over flat tables today.
Standardized bronze-to-silver pipeline for external data. Today external data parsing is ad hoc.
Real-time SCADA/MES ingestion onto the unified timeline.
Proactive pattern surfacing without a question.
Query and feedback instrumentation for future learning loops.
DOCS — Standardize
Status: Concept. Nothing built. (only demo Floris local)

What is in scope for May (Mutares POC):

Simple PDF upload and storage.
QR scan to view documents linked to that asset.
Ask questions to those documents (RAG).

What is in scope for v1.0 (September):

Desktop authoring environment using an open source document editor.
Database-built documents with metadata, alongside imported PDFs.
QR-driven document access on the operator app.
SOP can reference a log via clickable launch (one-way reference, no embedding).

What is v1.1 or later:

AI-assisted SOP authoring (IDA-in-DOCS mode). [PREFERABLY EARLIER]
Live SOP feedback while operator runs an SOP.
Logs embedded inside SOPs as the work-instruction layer.


4. THE LOG MODEL: PRIMITIVES, OBJECTS, AND INITIATION
Oppr does not build new tools per use case. Oppr builds a primitive system that customer engineers configure into the data capture flow they need. The 5 use cases (Section 7) are different recipes of the same primitives.

This section defines three things: the primitives (the building blocks of a log), the object model (logs, stations, rounds, assets), and the initiation model (how a log gets started in the field).
4.1 The 6 log primitives
These are the building blocks a customer engineer drags into a log when configuring it. Combined, they cover roughly 95% of field capture situations.

#
Primitive
Purpose
Status today
v1.0 target
1
Multiple choice
Single or multi-select answers, predefined options.
Working
Unchanged.
2
Single-line text
Short free-text input (codes, numbers entered as text, names).
Working
Unchanged.
3
Numeric value
Numeric input with optional min/max and unit.
Working
Unchanged.
4

Floris: we need to think about this. I prefer changing text input into just input (or something generic) where we have a microphone as a always accessible input option (so we dont need separate voice input)
Voice note
Operator speaks an observation. One voice note = one observation at v1.0.
Working (transcription stored, audio storage to confirm)
Audio storage confirmed and persistent. Single observation per voice note. Dissection roadmap.
5
Photo
Free photo or HMI template with guided field-level extraction.
Working
HMI template repurposed for sticker OCR (one-field config).
6
Sign-off / acknowledgment
Operator confirms an action with a deliberate gesture.
Workaround: text field with operator name.
Dedicated primitive. Slider or two-step button to prevent accidental confirmation. Backend stores boolean confirmed status with timestamp and user ID.


No new primitives at v1.0 unless customer feedback during Mutares POC and Renewi project surfaces a primitive that is genuinely missing. Oppr's first job at POC kickoff is to teach customer engineers how to compose existing primitives, not to ship new ones.
4.2 The object model
Five objects. Clear nesting.

Object
What it is
Asset
A machine, line, or station in the plant. Mapped 1:1 to a QR code. Platform-scoped at v1.0.
Log
An ordered sequence of primitives. Configured by the customer engineer. Has a type: asset-anchored or asset-agnostic. May belong to one or more projects.
Station
An asset + a log, used inside a round. The same asset can appear in multiple stations across different rounds.
Round
An ordered sequence of stations. Has a schedule (recurring with notification) or runs ad hoc.
Project
A grouping of logs and rounds with a common goal (maintenance, safety, quality, lean). Defines context for the customer team.


One QR, many logs. A single QR code on a machine can be linked to multiple logs across different projects. When an operator scans, the app must disambiguate (see 4.4).
4.3 Asset-anchored vs asset-agnostic logs
Every log is configured as one of two types when the customer engineer creates it.

Log type
Anchored to
Examples
Asset-anchored
A specific asset (or set of assets) via the QR registry. Cannot run without a confirmed asset.
Quality check on extruder, maintenance round on shredder, override capture on sorter, intake pallet logging.
Asset-agnostic
Nothing. Site-level only. Can run anywhere, anytime, no QR required.
Unsafe situation report, lessons learned capture, general observation, end-of-shift summary, lean walk where the operator must capture observations anywhere.


The log configurator must enforce this choice at log creation time. This prevents the failure mode where a log requires a QR scan but no asset is relevant, or where a log expects no asset and an operator scans one anyway.
4.4 The 6 log initiation paths
A log can be initiated in six different ways depending on what the operator is doing and the type of log. The app handles all of these. The customer engineer does not configure initiation paths; the path is implicit in the log's type and whether it is part of a round.

#
Path
What happens
1
Scan QR at machine, single asset-anchored log
Operator scans the QR. App offers a menu: view documents for this asset, ask IDA about this asset, or run a log. If multiple logs are linked to this QR (across projects), the operator picks one. The selected log opens.
2
Self-start asset-anchored log from the app
Operator browses logs in the app, picks one. The log requires asset confirmation, so the app instructs the operator to go to the relevant machine and scan the QR. No scan, no log.
3
Self-start asset-agnostic log from the app
Operator picks an asset-agnostic log (e.g., unsafe situation). Opens immediately. No QR required.
4
Scheduled round triggered by notification
At the scheduled time, the operator gets a notification. Tapping it enters round management mode. App shows the floor plan, instructs operator to go to station 1, scan that station's QR, run the log. After completion, app guides to station 2. And so on. Stations must be completed in order.
5
Self-started round, ad hoc
Operator opens the app, picks a round (e.g., the maintenance round normally scheduled for 6am). Same round management mode as path 4: floor plan, go to station 1, scan, run log, repeat. Used when the operator wants to run a round more often than scheduled.
6
Single station of a round, triggered by scanning at the machine
Operator passes a machine that is part of a scheduled round, scans its QR. App recognizes the asset is part of round X. Asks: "This is part of [Round Name]. Run only this station, start the full round here, view documents, or ask IDA?" If operator picks "run only this station," the log runs as a standalone execution. The round itself is unaffected (it can still be triggered later by notification or self-start).


Round behavior rules

Stations are completed in order. The app enforces this.
Operator can skip a station, but must give a reason.
If a scheduled round is not started within 1 hour of its notification, it is marked skipped at v1.0. Configurable timeout windows are post-v1.0.
One round = one operator. Two operators cannot run the same scheduled round in parallel at v1.0.
Scanning a station's QR mid-round, when the round is in progress and the scan is out of order, is refused. App tells the operator to go back to the correct step.

Single-station rounds are valid. A round with one station is just a round with one station. This is how v1.0 supports a single asset-anchored log being scheduled with notifications. Scheduling lives at the round level only.
4.5 What the operator sees when they scan a QR
The QR scan menu is the central operator interaction in the field. At v1.0 the menu offers, in order:

Run a log (lists logs linked to this asset across all the operator's projects; if exactly one, runs it directly; if zero, hides this option).
View documents (shows documents linked to this asset).
Ask IDA (opens the operator IDA chat scoped to this asset's documents).

If the operator is mid-round and scans a station that belongs to that round, the menu also offers "continue with round" as the highlighted option.
4.6 Composability rules
A log is an ordered sequence of any number of the 6 primitives.
A log's type (asset-anchored or asset-agnostic) is set at configuration time, not at execution time.
A station = asset + log. Asset-agnostic logs cannot be stations.
A round = ordered sequence of stations. Schedule lives at the round level.
A QR code can map to one asset; that asset can be referenced by multiple logs across multiple projects.
4.7 What this means for v1.0 capabilities
This section drives several capability rows in Section 8:

Asset/QR registry must be platform-scoped, not project-scoped (Section 6).
Log configurator must enforce the asset-anchored vs asset-agnostic choice at creation time.
The QR scan menu (the disambiguation flow) is a new app surface.
Round management mode (floor plan, station-by-station guidance, in-order enforcement, skip-with-reason, missed-round handling) is largely existing but needs refinements at v1.0 to handle the new initiation paths.
Ad hoc single-station execution from a station's QR (path 6) is a new behavior and needs explicit support.


5. THE UNIFIED TIMELINE, DATA MODEL, AND INTELLIGENCE LADDER
This section sets out how Oppr structures data and how that structure unlocks progressively higher intelligence for the customer. Two parallel models, each with its own progression, that meet in the middle. The data quality model is industry-standard Medallion architecture. The intelligence ladder is Oppr's framing of what the platform does for the customer at each stage.

The two are linked but distinct. Higher intelligence requires higher data quality, but higher data quality alone does not produce intelligence. Intelligence is what the platform does on top of the data.
5.1 The unified timeline
Every event Oppr touches lands as a timestamped point on a single timeline. The point is more useful the more it is connected: to an asset, a location, a project, an operator, a log, a round, a shift. Connectedness is what makes correlation possible and what makes IDA useful.

The unified timeline is the central abstraction across LOGS, IDA, and DOCS. Operator voice notes, photo captures, structured form values, scheduled round entries, uploaded SCADA tags, batch records, lab results all live on the same timeline, joined to the same canonical entities (asset, operator, project, site).
5.2 The data quality model: Bronze, Silver, Gold
Oppr uses the Medallion architecture pattern. Three layers of progressive refinement, each rebuildable from the layer below.

Layer
Definition
Where each data source lands
Bronze
Raw landing zone. Source-of-truth copy of the data as it arrived. Stored unchanged for audit and reprocessing.
External data (Excel with merged cells, CSV exports, SCADA dumps, lab system extracts) lands here. App-captured raw assets (the original voice file, the original photo) also live here for reprocessing.
Silver
Cleaned, schema-conformant, joined to canonical entities. Deduplicated, type-cast, validated. Linked to asset, operator, log, round, project, timestamp. This is the layer IDA queries for cross-source analysis.
App-captured data lands here directly because the metadata is attached at capture time. External data is promoted to silver after parsing and after the tag-to-asset mapping is applied.
Gold
Pre-computed, aggregated, consumption-shaped data. Dashboards and pre-computed views read from gold for speed.
Minimally built at v1.0. Aggregations are computed on-the-fly from silver. Gold becomes meaningful as the platform moves into Level 4 intelligence (see 5.4).

The Oppr capture advantage: bronze-to-silver promotion is implicit for app data
This is where Oppr breaks from a traditional data lake setup. App-captured data does not need a long enrichment pipeline because the metadata is attached at the moment of capture.

When an operator scans a QR and runs a log, the system already knows which asset, which operator, which log, which round, which project. The phone transcribes the voice note, the photo is stored with its HMI/OCR fields extracted, the form values are resolved. The resulting LOG entry lands directly in silver, ready for cross-source query.

External data is the opposite. A SCADA tag like AP_563 plus a value plus a timestamp is meaningless on its own. To be useful for IDA's correlations, that tag has to be mapped to a canonical asset (AP_563 → EXTRUDER_8C). That mapping is configured once during onboarding and reused for every subsequent upload of the same source. Until that mapping exists, the data sits in bronze.

This is a real commercial differentiator. Customers used to MES rollouts and historian projects expect long mapping exercises before any analysis is possible. With Oppr, the LOGS half of the data is queryable from day one. The mapping work only applies to whatever external data they choose to bring in. The 14-day onboarding target depends on this.
5.3 External data ingestion at v1.0
Two ingest paths. Both flow through the bronze → silver promotion described above.

1. CSV upload via desktop UI. Customer downloads from their MES, SCADA, historian, lab system, or batch records. Uploads via a desktop file upload screen. Oppr provides a standard upload template per data type so the customer formats correctly. The tag-to-asset mapping is configured once during onboarding by the customer engineer. This is the primary path at v1.0.

2. Real-time SCADA/MES integration via OPC UA. Read-only. Tags ingested onto the unified timeline as they update. Same mapping system applies. Specific vendor adapters scoped after the technical gap analysis. Stretch goal for v1.0. Tech team confirms scope.

Bidirectional integration is not in scope.
5.4 The intelligence ladder
Oppr's value to the customer climbs through four levels. Each level represents a tangible jump in what the platform does for the customer versus what the customer has to do themselves. Levels 1 through 3 are v1.0 commitments. Level 4 is the direction the platform is heading.
Level 1: Manual exploration
The customer captures data and looks at it themselves. Lists, exports, raw queries. They form their own hypotheses and build their own correlations in Excel. The platform is a structured database with a clean UI on top. Better than paper, but the analytical work lives entirely with the customer.

Every plant operating without a tool like Oppr is at Level 1 today, usually with paper, Excel, or both.

v1.0 status: supported.
Level 2: Static dashboards
Dashboards built once, viewed many times. Configured graphs, KPIs by column math, drill-downs. The same questions get answered the same way every day. Comparable to a Power BI dashboard.

The customer engineer builds the dashboard once. After that it runs without intervention. The operations manager opens it on Monday morning and sees what changed.

v1.0 status: working today in LOGS. Per-project dashboards, configurable graphs, basic KPI math. Per-site rollups are post-v1.0.
Level 3: Conversational intelligence
The customer asks IDA questions in natural language. IDA reasons across the unified timeline, queries silver tables, retrieves from documents, and returns answers grounded in the customer's actual data and procedures. The customer drives the inquiry. The system does the analytical work.

The technical foundation that makes Level 3 possible is the combination of three things working together:

A knowledge graph of the customer's plant: assets, lines, sequences, dependencies, supplier-batch relationships. IDA references this so a question about "Line 8" pulls in everything related to that line, not just rows tagged with the literal string.
RAG over documents so IDA can cite procedural and tribal knowledge from SOPs, manuals, and authored DOCS content alongside hard data.
SQL over structured data so IDA gets fast, deterministic answers for quantitative questions.

Most analytics tools do one of these. The combination is what lets IDA move between "what does the SOP say about this" and "how often did this happen last month" in a single conversation.

v1.0 status: desktop IDA at v1.0. Operator app IDA at v1.0 (scoped to documents linked to the scanned asset). Reactive only. Engineer or operator asks, IDA answers. Proactive surfacing is post-v1.0.
Level 4: Autonomous agents (roadmap)
IDA runs on its own. Scheduled checks against KPIs. Proactive surfacing of patterns the customer did not ask about. Multi-agent setups where specialized agents (downtime, quality, maintenance, safety) report into a daily aggregated review for the operations manager.

At Level 4 the customer reviews output rather than driving inquiry. Time spent goes from hours per week querying to minutes per day reviewing.

v1.0 status: not in v1.0. Roadmap. Articulated here so customers see the trajectory.
5.5 How the ladders connect
Each intelligence level requires a certain data quality foundation. This is where Medallion and the intelligence ladder meet. The work the tech team does on the data foundation directly determines which intelligence level Oppr can offer.

Intelligence level
Data quality required
What enables the jump
L1 Manual exploration
Bronze (raw) is enough
Customer reads the raw data themselves
L2 Static dashboards
Silver across LOGS data
Schemas must be consistent for dashboards to render correctly
L3 Conversational intelligence
Silver across LOGS and external data on a unified timeline, plus knowledge graph + RAG + SQL access
IDA needs to know what an asset is, what downtime means, how machines relate
L4 Autonomous agents
Silver + Gold (pre-computed views for speed) + ML feedback loop
Agents need predictability of access patterns and a way to learn from how questions get asked


The customer's POC journey is also a journey up the intelligence ladder:

Week 0 to 2: capturing data (Level 1, replacing paper).
Week 3 to 4: dashboards reading silver (Level 2).
Week 5 to 6: IDA answering questions (Level 3). This is the ROI moment in the 8-week POC frame.
Beyond v1.0: autonomous agents surfacing patterns (Level 4).

This frame protects the price ladder over time. A customer paying for Level 2 plus Level 3 today is buying access to Level 4 tomorrow on the same platform, without a migration.
5.6 Self-improving intelligence (a Level 4 enabler)
A piece of the Level 4 vision worth flagging now because it shapes how the platform should be instrumented from v1.0 onward.

Every IDA conversation is itself a signal. The questions customers ask, the answers they accept or reject, the follow-ups they need, the gaps they hit, all carry information about what the platform should be getting better at. Capturing that signal in a structured way (a feedback loop in the background) lets IDA become more correct, assertive, and pragmatic over time, in two complementary ways:

Customer-specific improvement. IDA learns the language of this customer's plant: what they call things, what KPIs they care about, what patterns repeat, what their process engineers look for. Answers become more relevant per-customer.
Industry-agnostic learnings. Patterns in how questions get asked and answered across customers in similar industries (waste, recycling, process manufacturing) feed back into IDA's defaults. New customers benefit from what previous customers asked.

This is not a v1.0 build. The instrumentation to capture the signal is light, and ideally lands during v1.0 even if no learning logic runs against it yet. That way by the time the learning logic ships, there is real history to train on.

v1.0 status: light instrumentation in scope as a stretch (capture queries, capture which answers were useful). The actual learning logic is roadmap.
5.7 v1.0 data team scope
Two parallel jobs, both required for the v1.0 commitments above to hold:

App side. Confirm that every capture flowing through the app lands in silver without manual enrichment. The metadata schema (timestamp, operator, asset, log, round, project, shift-derived-from-time) must be applied automatically at capture and never lost in transit. If anything in the current pipeline drops metadata along the way, fix it. This is the foundation for Levels 2 and 3.
External data side. Build the bronze-to-silver promotion cleanly. Standardized parsing per upload template plus a tag-to-asset mapping system the customer engineer configures during onboarding. This is the work that turns AP_563 into something IDA can correlate with operator observations on the same machine.

A third job, lighter weight: knowledge graph foundation. A basic knowledge graph at v1.0 covering assets, lines, sequences, and key dependencies. Just enough for IDA to reason about plant context. Full multi-customer knowledge graph for cross-industry learning is post-v1.0.

Without these three pieces working together, IDA cannot deliver Level 3 reliably. With them, the path to Level 4 is open.


6. THE ASSET AND QR CODE ARCHITECTURE
Today the asset and QR code registry is project-scoped in LOGS. For v1.0, this must be platform-scoped.
Why this matters
DOCS at v1.0 needs to attach documents to assets so a QR scan in the field returns the documents for that machine. A single QR can also map to multiple logs across multiple projects. If assets and QR codes live inside a single project, neither use case works cleanly.
v1.0 model
Assets are first-class platform objects, scoped to a tenant and a site.
QR codes map 1:1 to assets.
Logs reference assets (asset-anchored logs only).
Documents reference assets.
Future modules attach to the same registry.
What stays unchanged
Floor plans and area maps already exist in LOGS for project-scoped use. At v1.0, these become accessible across modules via the platform-scoped asset registry. The visualization itself does not need to change.
Document-to-asset linking
Document naming convention (e.g., HOL-OPS-MAN-0001) is human-readable metadata for the user, not the system's lookup mechanism. The system anchors on asset_id ↔ document_id mappings. A document can be linked to one or many assets. A QR scan returns all documents linked to the scanned asset.


7. THE FIVE USE CASES AS PRIMITIVE CONFIGURATIONS
Each use case is a configuration of the 6 primitives plus the platform features (QR registry, scheduled rounds, IDA, DOCS). Customer engineers self-configure using the log builder. Oppr supports them in the first 1-2 weeks of any POC.

The first ICP is waste, recycling, and waste-to-energy.
Use Case 1: Multimodal capture for variable feedstock prediction
What it is: operations with variable hard-to-document inputs rely on operator judgment at intake, sorting, and feeding. Excel fails at that variability. Oppr replaces it with multimodal capture that turns operator perception into atomic data points usable for prediction.

Stakeholder benefit:

Operator: capture in seconds. Voice and photo feel natural. No clipboard.
Process engineer: correlate intake characteristics with downstream outcomes.
Operations manager: traceable feedstock quality, lower unplanned downtime.

Renewi specifics (current paper-based flow): customer pre-announces truck contents → internal confirmation → truck arrives → warehouse uses 25 predefined 4-digit pallet codes (paper sticker, no QR on pallets at this stage) → pallets sorted by category → forklift driver later picks pallets and writes numbers on paper.

Log type: asset-anchored (intake station, sorting station, shredder feed).

Primitive recipe:

Photo (HMI template configured for sticker OCR) to capture the pallet number sticker.
Voice note describing contents.
Multiple choice for category tagging.
Numeric for weight or count where available.

Initiation path: path 1 (scan at the asset) for the most common case, path 2 (self-start, then scan to confirm location) for less frequent ad hoc captures.

Data flow: LOGS captures → silver layer with metadata attached at capture → joins on the unified timeline to oven downtime events from external imports or SCADA tags → IDA correlates intake signature with downstream incidents.

8-week POC version: capture replaces paper for one feedstock stream and one shift pattern. By Week 6, 40+ batches captured and a first correlation between intake signature and downstream events.
Use Case 2: Operator override and intervention capture
What it is: operators at variable-input plants spend significant time overriding automation, clearing blockages, recalibrating, rerouting. This work is invisible today. Oppr captures every override as a structured event.

Stakeholder benefit:

Operator: "I just unblocked the sorter for the third time today" becomes a 30-second voice note.
Process engineer: override frequency reveals which assets are unstable.
Operations manager: firefighting hours become a quantified line item.

Log type: asset-anchored (override always relates to a specific machine).

Primitive recipe:

Multiple choice for override type.
Voice note for context.
Photo optional.
Sign-off to confirm the action was taken.

Initiation path: path 1 (scan at the affected asset) or path 2 (self-start from app, scan to confirm).

Data flow: LOGS captures override event → IDA aggregates by asset, shift, operator, feedstock type → correlates with downtime and quality metrics.

8-week POC version: override capture deployed on 2-3 critical assets. By Week 6, top 5 override types ranked by frequency and cost.
Use Case 3: Shift handover as a structured QR walk
What it is: replaces WhatsApp groups, paper books, verbal handoff. Outgoing operator walks a defined route via a round, scans QRs, leaves notes. Incoming operator walks the same round, sees the briefing in context.

Stakeholder benefit:

Operator: clean context-rich handoff at the actual machines.
Process engineer: handover data reveals cross-shift patterns.
Operations manager: consistent handover quality across shifts and sites. Reduces shift-to-shift variability.

Log type: asset-anchored logs at each station of the handover round.

Primitive recipe per station:

Voice note for context.
Multiple choice for status (green/yellow/red).
Sign-off at the end of the round.

Initiation path: path 4 (scheduled round triggered by shift change notification) for the standard handover, path 5 (self-start round) if the operator wants to run an ad hoc check.

Data flow: LOGS captures handover round → IDA extracts to-do items from notes → cross-shift pattern analysis.

8-week POC version: structured handover deployed across one shift pattern. Adoption rate is the Week 3 metric.
Use Case 4: Lessons-learned-to-SOP cycle
What it is: the closed loop made concrete. IDA reactively surfaces a pattern when the process engineer asks. Process engineer validates. DOCS captures the update. Operators get notified at the next QR scan.

Honest framing: today this is reactive (engineer asks, IDA answers). The cycle is realistically monthly, not weekly. v1.0 supports completing one full cycle inside an 8-week POC.

Stakeholder benefit:

Operator: SOPs reflect reality. Notified when something changes.
Process engineer: drafting an SOP from an insight becomes faster (manual at v1.0, AI-assisted at v1.1).
Operations manager: improvements stick. Standardization across operators and shifts.

Primitive recipe: existing log capture creates the data baseline. The cycle uses any combination of primitives configured by the engineer for whatever capture supports the validation work.

Initiation paths: all six paths, depending on what the new SOP triggers (scheduled round, ad hoc capture, etc.).

Data flow: LOGS data → IDA pattern surfacing (Level 3 reactive) → DOCS authoring → operators see updated docs via QR scan → LOGS captures execution under the new procedure → IDA quantifies before/after.

8-week POC version: one full cycle completed inside the POC. By Week 7, one validated insight has become one updated SOP that operators have signed off on.
Use Case 5: Maintenance inspection rounds (FMEA-derived)
What it is: the customer runs an FMEA-style review of their equipment. Equipment is assigned to maintenance inspection rounds at appropriate frequency (daily, weekly, monthly). Each round is a structured set of stations with logs at each: scheduled questions, photo confirmations, sign-offs.

Note on naming: this is a maintenance inspection round, derived from FMEA analysis the customer runs separately. Oppr does not run the FMEA. Oppr captures the resulting rounds.

Stakeholder benefit:

Operator: clear schedule, clear instructions, clear sign-off.
Process engineer: structured maintenance data lets them predict failures and prioritize spare parts.
Operations manager: predictability on equipment failures. Reduced unplanned downtime on critical assets.

Log type: asset-anchored logs at each station.

Primitive recipe per station:

Multiple choice (status).
Photo (if needed).
Numeric primitive for measurements (vibration reading, temperature, oil level).
Sign-off.

Initiation path: path 4 (scheduled round triggered by notification) is primary. Path 5 (self-start round) when an operator wants to run an extra check. Path 6 (scan a single station ad hoc) when an operator passes a machine and wants to do a quick check on just that asset.

Data flow: LOGS scheduled rounds → IDA correlates round observations with failure events → DOCS captures the maintenance procedure per asset.

8-week POC version: maintenance inspection rounds covering 10-20 assets. Daily, weekly, monthly cadence running by Week 4. By Week 6, first validated correlation between a check observation and a downstream event.

v1.0 promise: the platform supports this configuration. Oppr provides documentation showing how to compose the round using existing primitives. Pre-built templates are NOT in v1.0. Templates as a packaged feature come post-v1.0 as part of the best-practice catalog.
Roadmap (not in v1.0): treasure hunt training mode
The treasure hunt concept (QR-led structured walks for training, with adaptive difficulty for new hires, post-SOP-update training, and randomized refreshers) is a 6-month roadmap item. Mentioned only when discussing where the platform is heading.
Worth considering: asset-agnostic round (e.g., daily 5S walk)
A round can also be built from asset-agnostic logs in a special configuration: the operator is asked to make a round and capture at least N observations, anywhere in the plant, no QR required per observation. Useful for daily lean walks or 5S audits. Not in the v1.0 critical path but a natural extension worth flagging for Mutares discussion.


8. v1.0 MINIMUM CAPABILITIES (TECH HANDOFF TABLE)
This is the artifact the technical team takes for the gap analysis. Status is from the customer/business perspective. Technical implications are Floris's best understanding. The tech team validates and refines.

#
Capability
Module
Use case driver
Status today
v1.0 target
Notes / technical implication
1
Self-service log configurator
LOGS
All
Working
Unchanged
No new build. Confirm scaling.
2
6 log primitives composable
LOGS
All
5 of 6 working
Add sign-off button/slider, confirm voice audio storage
Sign-off = slider or 2-step button. Backend stores boolean + timestamp + user.
3
Log configurator enforces asset-anchored vs asset-agnostic at creation time
LOGS
All
Unconfirmed
Explicit choice required at log creation; affects initiation behavior downstream
Prevents the failure mode of QR-required logs without an asset, or vice versa.
4
Asset/QR registry decoupled from projects
LOGS + DOCS
All
Project-scoped today
Platform-scoped, shared across LOGS and DOCS
Database refactor. Moderate lift. Tech team confirms scope.
5
One QR can map to multiple logs across projects
LOGS
All
Unconfirmed
When operator scans, app disambiguates between linked logs
Required because a single asset can appear in quality, maintenance, and safety projects simultaneously.
6
QR scan menu (run a log, view documents, ask IDA)
LOGS + DOCS + IDA
All
Not built
New app surface presented after every QR scan
Central operator interaction point. Drives all field-initiated workflows.
7
Self-start asset-anchored log with QR confirmation (path 2)
LOGS
All
Partial
Operator picks log from app, app guides to asset, scan confirms location, log opens
Important for ad hoc captures away from a scheduled round.
8
Self-start asset-agnostic log (path 3)
LOGS
UC4 + safety/lean walks
Partial
Opens directly with no QR.
Used for unsafe situation reports, lessons learned, observations.
9
Round management mode (floor plan, station-by-station guidance)
LOGS
UC3, UC5
Working
Refined to handle new initiation paths cleanly
Existing behavior. Confirm in-order enforcement, skip-with-reason, missed-round handling.
10
Single-station execution from QR scan when station belongs to a round (path 6)
LOGS
UC2, UC5
Not built
Operator scans station QR, app offers "run only this station" option, logs as standalone execution without affecting the parent round
New behavior. Important for ad hoc check by passing operator.
11
Mid-round out-of-order scan refused
LOGS
UC3, UC5
Unconfirmed
App rejects, instructs operator to go to the correct station
Enforces round integrity.
12
Missed-round handling (1-hour timeout at v1.0)
LOGS
UC3, UC5
Unconfirmed
If round not started within 1 hour of notification, marked skipped
Configurable timeout windows are post-v1.0.
13
Voice audio persistent storage
LOGS
All
Unconfirmed (transcription stored, audio likely not)
Audio stored in addition to transcription
Required to support v1.1 voice dissection. Storage cost trivial.
14
HMI template repurposed for sticker OCR
LOGS
UC1
HMI template exists
One-field config for OCR stickers
Small build. Configuration change.
15
Per-project dashboard with configurable graphs
LOGS
All
Working
Unchanged for v1.0. Per-site view post-v1.0.
Dashboard does not show externally uploaded data. That goes to IDA only.
16
Metadata enrichment at capture time, app data lands in silver directly
LOGS + IDA
All
Partial
Every app capture lands in silver with timestamp, operator, asset, log, round, project metadata applied automatically
Foundation for L2 and L3 intelligence. Confirm metadata is never dropped in transit.
17
Bronze-to-silver promotion for external data with tag-to-asset mapping
IDA
All
Ad hoc today
Standardized parsing per upload template + customer engineer configures tag-to-asset mapping during onboarding
The mapping system is a customer-facing UI, not a backend-only feature.
18
External data file upload UI (desktop)
IDA
All
Not built
Basic upload screen, validates against template
Mutares POC scope.
19
Real-time SCADA/MES read-only ingestion via OPC UA
IDA
UC1, UC4, UC5
Not built
Read-only OPC UA ingestion onto unified timeline
Stretch goal v1.0. Tech team scopes. May split into "real-time" vs "CSV upload" tracks.
20
Knowledge graph foundation (assets, lines, sequences, dependencies)
IDA
UC1, UC4, UC5
Not built
Basic plant knowledge graph at v1.0, just enough for IDA to reason about asset relationships
Required for Level 3 conversational intelligence. Full multi-customer graph is roadmap.
21
Desktop IDA chat over LOGS + uploaded data + knowledge graph
IDA
All
Working (MVP, flat tables)
Hardened, runs on bronze/silver pipeline + knowledge graph + RAG + SQL
Existing functionality, improved data foundation and reasoning.
22
Operator app IDA chat (voice-first, docs only)
IDA
All
Not built
Reached via the QR scan menu. Scoped to docs linked to the scanned asset. Voice-first with text fallback.
Mutares POC scope (basic version). Hardened by v1.0.
23
IDA query and feedback instrumentation
IDA
Future learning
Not built
Light capture of queries, answer relevance signals, follow-up patterns
Stretch for v1.0. The learning logic itself is post-v1.0; the data must start flowing now.
24
Aggregated operator value report
IDA
Recognition story
Not built
Done as IDA prompts in desktop, not as a feature
Watchlist. Process engineer asks IDA, sends summary to operators.
25
DOCS PDF upload and storage
DOCS
UC1-5
Not built
Basic PDF upload, storage, retrieval
Mutares POC scope.
26
DOCS RAG over uploaded PDFs
DOCS
UC1-5
Not built
Ask questions against PDF content
Mutares POC scope.
27
DOCS desktop authoring (database-built)
DOCS
UC4
Not built
Open source document editor with metadata, naming convention
v1.0 build. Database-built docs alongside imported PDFs.
28
DOCS QR scan to asset-linked documents (mobile)
DOCS
UC1-5
Not built
Reached via the QR scan menu. Operator sees all docs linked to that asset, can ask questions.
Depends on shared asset/QR registry (capability 4).
29
SOP-to-log clickable reference
DOCS + LOGS
UC4, UC5
Not built
An SOP can include a button that launches a specific log
Small build. Not the same as embedding logs in SOPs (that is v1.1).
30
In-app feedback button (bug report / feature request)
All
Internal
Not built
Bottom-right button on operator app. Screenshot + voice command captured for review.
Add quickly. Helps Oppr understand operator and engineer pain.
31
Multi-tenancy with hard isolation
Platform
All
Working
Confirmed
Treated as already solved per Floris.



9. OUT OF SCOPE FOR v1.0
Explicit. So the tech team does not waste effort.

Voice dissection (one voice note = many observations).
AI-assisted SOP authoring inside DOCS.
Live SOP feedback while operator runs an SOP.
Logs embedded inside SOPs as the work-instruction layer.
Pre-built best-practice templates (post-v1.0 product line).
Treasure hunt training mode.
Proactive IDA agents (scheduled checks, push alerts). Level 4 intelligence as a whole is roadmap.
Per-site dashboard (per-project only at v1.0).
Externally uploaded data on the LOGS dashboard (IDA only).
Real-time bidirectional SCADA/MES integration.
Multi-site rollout features (single-site rollout works, multi-site features post-v1.0).
Operator gamification or personalization beyond aggregated team-level value reports.
Insights integration with the execution platform.
AI scene analysis on photos beyond HMI template extraction.
Two operators running the same round in parallel.
Configurable round timeout windows beyond the fixed 1-hour rule.
Gold layer pre-computed views beyond what the existing dashboard requires.
ML-based learning logic on top of the IDA query feedback instrumentation.
Multi-customer knowledge graph for cross-industry learning.
Watchlist (not in v1.0 scope but worth considering)
Aggregated operator value reports as a packaged IDA prompt set.
Slider variant of sign-off primitive vs simple button (decision still open).
Audio file storage retention policy.
CSV-only path as a fallback if OPC UA real-time integration slips.
Asset-agnostic rounds (e.g., daily 5S walk requiring at least N observations anywhere in the plant). Worth piloting with Mutares.
IDA query feedback instrumentation lands in v1.0 even if learning logic does not, so historical data exists when learning ships.


10. UI/UX REQUIREMENTS
Two surfaces. Different design priorities.
Operator mobile app
Audience: field operators. Wear gloves, work in noise, work in any language. Many have minimal tech experience.

Design priorities:

Self-serve. No onboarding session needed. The app should be usable from minute one.
One-click interface. Every action reachable in one or two taps from the home screen.
Big tap targets. Operators wear gloves.
High contrast. Plant lighting is bad.
Voice-first capture. Talking is faster than typing.
Offline capable. Connectivity on factory floors is unreliable.
Latency budget for capture: under 2 seconds from intent to confirmation.
Simple to use, minimal onboarding, ideally self-serve from minute one.

Three primary modes at v1.0:

Log execution mode. Operator runs a log, whether started by QR scan, self-start, or as part of a round.
DOCS lookup mode. Operator views documents linked to a scanned asset, opens or asks questions.
Operator IDA chat mode. Voice-first or text question, scoped to the scanned asset's documents.

All three are reachable from the QR scan menu, which is the universal entry point. Self-start flows for asset-agnostic logs (e.g., unsafe situation) and for picking a scheduled round are available from the app's home screen without scanning.

Round management mode is a sub-mode of log execution. Once a round is initiated, the app shows the floor plan, instructs the operator station by station, and only accepts in-order completion.
Desktop knowledge worker app
Audience: process engineers, operations managers. Sit behind a desk. Use the tool deliberately, not in a hurry.

Design priorities:

Functional and well-organized, not flashy.
Onboarding can be longer. A 30-minute training is acceptable for a process engineer.
Density over simplicity. Power users want information, not whitespace.
Cross-tool fluency. IDA query, log configuration, DOCS authoring should feel like one workspace.

Components at v1.0:

Log configurator (existing, drag-and-drop log builder; adds asset-anchored vs asset-agnostic choice).
IDA chat (existing MVP, hardened on bronze/silver pipeline plus knowledge graph + RAG + SQL).
DOCS authoring environment (new, open source editor with metadata).
File upload screen for external data, including tag-to-asset mapping configuration (new).
Per-project dashboard (existing, configurable graphs and basic KPI math).

Operations manager has no separate dashboard at v1.0. Same desktop as the process engineer. Workflow: open dashboard → spot something off → open IDA → ask about it. Per-site dashboard is post-v1.0.
Cross-cutting UI requirement
In-app feedback button. Bottom-right corner of the operator app. Press to capture screenshot + record a voice command describing the bug or feature request. Sent to Oppr's product team. This closes the feedback loop without forcing the operator into a separate channel.


11. POC KICKOFF AND ONBOARDING READINESS
v1.0 is not just code. It is the operating muscle to take a customer from contract signed to operators capturing data in under 14 days, repeatably, while running multiple POCs in parallel.
The 14-day onboarding target
Day
Activity
Owner
0
Contract signed. Three success criteria co-signed by champion and EB.
Floris + customer EB
1-3
Tenant provisioned. Floor plan and asset registry imported. QR codes generated.
Oppr
1-3
First log workshop with customer process engineer. Oppr coaches on primitive composition and asset-anchored vs asset-agnostic decisions.
Oppr CSM + customer engineer
4-7
Customer engineer drafts first 3-5 logs (mix of asset-anchored and asset-agnostic). QR codes printed and placed in the field.
Customer engineer
4-7
If external data is in scope: customer engineer configures tag-to-asset mapping for one upload type.
Customer engineer + Oppr
8-10
Operators trained (90 minutes max per shift).
Oppr CSM + customer team lead
11-14
First scheduled rounds running. Data flowing. First IDA query session with process engineer.
Customer team + Oppr


Past Day 14, Oppr stays close but the customer runs the system.
The log design workshop
What Oppr brings to Week 0-1 of every POC, beyond the software:

A working session pattern that helps customer engineers decompose their capture needs into primitive recipes.
Examples of working log configurations from prior customers (anonymized).
Coaching on asset-anchored vs asset-agnostic choices.
Coaching on what is genuinely a new primitive request versus what is a creative recipe of existing ones.

This is repeatable knowledge work, not consulting hours. It must be packaged so Oppr's CSM (the post-Lars hire) can run it without Floris in the room.
The customer feedback loop
Customer engineers will request new primitives or features. Some will be genuinely new (good signal, possibly ship in v1.1+). Most will be misunderstandings of what existing primitives can already do. Oppr's job is to triage. The in-app feedback button (capability 30) plus continuous engineer conversations during POCs is the channel.

No formal feedback program at v1.0. Just discipline about reviewing every request against the existing primitive set before greenlighting a new build.


12. THE 8-WEEK POC FRAME
The shape of every commercial engagement once v1.0 ships. Lars's playbook applied. Note how each week of the POC corresponds to a step up the intelligence ladder defined in Section 5.

Week 0: pre-kickoff

Economic Buyer signs paper.
Three success criteria co-signed by champion and EB. In plant language (scrap %, downtime hours, override count, handover time, maintenance compliance %).
Quantified economic problem validated (directional baseline acceptable).
Pre-committed conversion clause: if criteria are met by Week 7, customer signs €75-100K annual contract.

Weeks 1-2: deploy (Level 1, capturing data)

Tenant provisioned. Asset registry imported.
First logs configured by customer engineer (with Oppr coaching).
QR codes placed.
Operator training (90 minutes per shift).
Baseline data flowing by Day 14.

Weeks 3-4: first signal (Level 2, dashboards)

First IDA insight delivered.
EB checkpoint #1.
Adoption is the metric here, not insights. "X operators logged Y entries this week" plus one preview pattern. Initial IDA conversations with limited but live data.

Weeks 5-6: IDA insights (Level 3, conversational intelligence) — the ROI moment

Quantified before-and-after on one specific problem (not a vanity dashboard).
ROI conversation opens.
First SOP update or maintenance routine adjustment.

Week 7: business review

Exit Memo finalized.
Contract enters procurement.

Week 8: convert

Annual contract signed at €75-100K.
Expansion roadmap agreed (additional use cases, additional sites later, eventual Level 4 access).
Honest note on contract triggers
Until the first few v1.0 POCs complete, Oppr will not have hard generalizable proof points. Early POCs are about defining the dissectable results that get turned into pre-committed triggers in later deals. v1.0 makes this repeatable; the early v1.0 POCs make the triggers commercially defensible.
Four non-negotiables for a POC to start
Quantified economic problem validated before kickoff.
Strong champion with a path to the EB.
Three success criteria co-signed at Week 0, in plant language.
Pre-committed conversion path written into the POC paper.


13. STAKEHOLDER VALUE AT v1.0
Every Oppr deal must land for three roles. If any role gets nothing, the system fails. Each role experiences Oppr at a specific set of intelligence levels.
Operator
Intelligence levels experienced: Level 1 (capture in app), Level 3 (conversational query in app, scoped to scanned asset's documents).

What they get at v1.0:

Capture in under 20 seconds via voice, photo, or simple form. Works with gloves, in noise, in any language.
One QR scan opens a clear menu: run a log, view documents, ask IDA. No confusion about what to do next.
Scheduled rounds with notifications and floor-plan-guided navigation.
Ad hoc captures (asset-anchored or asset-agnostic) when something needs reporting outside a scheduled round.
Reduced administrative burden compared to paper or Excel.
Simple sign-off when actions matter.
A direct feedback channel to Oppr (in-app button) when something breaks or is missing.

Honest gaps at v1.0:

No personal "your input saved €X" attribution.
No gamification.
No proactive suggestions from IDA.

The aggregated operator value report (delivered as IDA prompts the process engineer can run) is the v1.0 vehicle for recognition. Operators get told "the team's logging this month surfaced these issues, leading to these procedure changes." Recognition without overclaiming individual savings.
Process engineer (the champion in most deals)
Intelligence levels experienced: Level 1, Level 2, Level 3, fully on desktop. The power user of the platform.

What they get at v1.0:

One tool replaces the Excel scramble. LOGS data, machine exports, supplier batches, lab results all queryable in IDA on the unified timeline.
Conversational data analysis. Talk to IDA the way you would talk to a junior data analyst. IDA references the knowledge graph, retrieves from documents, runs SQL on silver tables.
Cross-analysis between captured and uploaded external data.
Self-service log configuration with explicit asset-anchored vs asset-agnostic choice.
Path from validated insight to updated SOP via DOCS desktop authoring.
Operator feedback flowing back through ad-hoc captures and round notes.

Honest gaps at v1.0:

AI-assisted SOP authoring is v1.1.
Proactive pattern surfacing (Level 4) is roadmap.
Live SOP feedback from running operators is v1.1.

Time savings target: 4-6 hours/week of triage and reporting compressed to ~1 hour curating insights and SOP updates. Realistically engineers will use IDA more, not less, because friction drops and analytical surface area expands.

The "we will not need this once issues are fixed" objection (Mutares raised it): continuous improvement never ends. Phase 1 is finding low-hanging fruit. Phase 2 is sustaining and standardizing those improvements. Phase 3 is going deeper, expanding scope, protecting against regression. Oppr is the operating execution platform that keeps the loop running. Stopping the platform stops the loop.
Operations manager (the economic buyer in most deals)
Intelligence levels experienced: Level 2 (dashboard glance), Level 3 (IDA on demand). Same desktop as the process engineer at v1.0.

What they get at v1.0:

Per-project dashboard with configurable graphs and basic KPI math.
Workflow: open dashboard → spot something off → open IDA → ask about it.
Visibility into invisible work (operator overrides, repeated unblockings, manual interventions become quantified).
Hard KPI inputs: unplanned downtime hours, feedstock variability cost, override frequency, quality cost, maintenance compliance, safety incident rate.

Honest gaps at v1.0:

No per-site rollup. Per-project only.
No automated alerts. Detection happens by looking at the dashboard or asking IDA.
Multi-site rollout is post-v1.0.
Level 4 autonomous agents (the eventual Monday-morning auto-summary) is roadmap.

The Monday morning experience at v1.0: open the dashboard. See what changed. If something looks off, ask IDA. Get a structured answer. Decide what to standardize this week. The Level 4 evolution turns this into a digest delivered automatically rather than something the manager has to drive.


14. WHO OPPR IS BUILT FOR
The pattern
Variable Input → Operator Judgment → Expensive Asset.
First focus: waste, recycling, waste-to-energy
Why this sector first:

Highest variable input. Feedstock changes every truckload.
Highest operator judgment dependency.
Expensive downstream assets damaged by off-spec feedstock.
Manual operations: operators move constantly between machines, clearing blockages, recalibrating, doing overrides.
Documentation is mostly paper or Excel, both of which fail at variability.
Repeatable playbook potential.
Adjacent sectors (post-v1.0)
Pulp and paper. Biomass. Biogas. Metal scrap and EAF mini-mills. Chemical batch processing. Dairy and food processing with variable inputs. All share the pattern. None get focused effort until the waste/recycling playbook is repeatable.
Buyer roles
Operator — primary user of the mobile app. Adoption owner.
Process engineer / CI lead — primary user of IDA and DOCS authoring. Champion in most deals.
Operations manager — economic buyer. Title varies (Plant Manager, Site Director, Operations Director). Use whatever title the prospect uses.
CFO — value-based pricing conversation. Anchored on cost of inaction.
CIO / IT — gatekeeper, not buyer. Reassure on integration and security. Do not let them set the agenda.


15. WHAT OPPR IS NOT
To prevent scope creep:

Not a connected worker platform in the Tulip/Poka sense. Digital work instructions are part of DOCS, not the product.
Not an MES. We sit below and feed it.
Not a SCADA replacement.
Not an ERP integration suite.
Not a generic LLM chatbot for manufacturing.
Not an IIoT sensor company. We never sell hardware.
Not a consultancy. We sell software with an OE/CI methodology baked in.

If a feature request pushes us into one of these boxes, push back.


16. APPENDIX: VOCABULARY
Use these terms consistently. Do not invent new ones.

Term
Meaning
Asset
A machine, line, or station, mapped 1:1 to a QR code. Platform-scoped at v1.0.
Asset-anchored log
A log that requires confirmation of an asset (via QR scan) before it can run.
Asset-agnostic log
A log that runs without any asset link. Used for site-level captures (unsafe situations, lessons learned, observations).
Bronze layer
Raw landing zone for data. Source-of-truth copy, stored unchanged for audit and reprocessing. External data lands here; raw app captures (audio file, photo) also live here for reprocessing.
Silver layer
Cleaned, schema-conformant, joined to canonical entities. The layer IDA queries. App-captured data lands here directly via capture-time enrichment. External data is promoted to silver after parsing and tag-to-asset mapping.
Gold layer
Pre-computed, aggregated, consumption-shaped data. Minimally built at v1.0. Becomes meaningful at Level 4 intelligence.
Capture-time enrichment
The Oppr property that app-captured data lands in silver immediately because metadata (timestamp, operator, asset, log, round, project) is attached at the moment of capture.
Medallion architecture
Industry-standard data lake design pattern using bronze, silver, gold layers.
LOG entry
A single capture from an operator. The silver-layer object.
Log (configured)
An ordered sequence of primitives. Built by the customer engineer in the self-service log configurator. Has a type (asset-anchored or asset-agnostic).
Primitive
One of the 6 building blocks of a log.
Round
An ordered sequence of stations. Has a schedule (recurring with notification) or runs ad hoc.
Round management mode
The app sub-mode where a round is in progress: floor plan, station-by-station guidance, in-order enforcement.
Station
An asset + a log, used as a step inside a round.
QR scan menu
The disambiguation flow shown when an operator scans a QR. Offers run a log, view documents, ask IDA.
Initiation path
One of the 6 ways a log gets started in the field. See Section 4.4.
Project
A grouping of logs and rounds with a common goal (maintenance, safety, quality, lean).
Timeline
The unified temporal sequence of all events for an asset, project, or site.
Unified timeline
The platform-wide timeline that joins LOGS data, external data, and document references on one time axis.
Observation
The semantic content of a LOG entry after parsing.
Knowledge graph
Structured representation of the customer's plant: assets, lines, sequences, dependencies. Referenced by IDA so a question about one asset pulls in everything related to it.
RAG
Retrieval-Augmented Generation. The technique IDA uses to pull SOP and document content into its answers.
SQL access
IDA's path for fast deterministic answers to quantitative questions over silver tables.
Tag-to-asset mapping
The customer engineer's onboarding configuration that links external data tags (e.g., AP_563) to canonical Oppr assets (e.g., EXTRUDER_8C).
Intelligence ladder
The four levels (Manual exploration, Static dashboards, Conversational intelligence, Autonomous agents) describing what Oppr does for the customer at each stage.
Self-improving intelligence
The Level 4 enabler where IDA's conversation history feeds a learning loop, making answers more correct, assertive, and pragmatic over time per-customer and across customers in the same industry.
SOP
A document combining safety, tools, context, and procedure. At v1.0, can reference a log via clickable launch. Logs embedded inside SOPs is v1.1.
Override / intervention
An operator action outside normal automation. Captured as its own log type.
LMRA
Last Minute Risk Assessment. A step (typically multiple choice) inside a log for high-risk work.
Site
One physical plant. The unit of pricing.
Tenant
A customer organization. May own multiple sites.
Operator
The frontline user. Primary user of the mobile app.
Process engineer
Power user. Configures logs, runs IDA analysis, authors DOCS. Champion in most deals.
Operations manager
Economic buyer. Cares about OEE, downtime, scrap, throughput, safety.
Insights
A separate Oppr product for asynchronous discovery. Out of scope for the execution platform v1.0.
Treasure hunt
A QR-led structured walk for training. Roadmap, not v1.0.




End of file. Update version number and changelog at the top when this document changes. Next expected revision after technical gap analysis (v0.6) and after Mutares POC kickoff lessons (v0.7).

