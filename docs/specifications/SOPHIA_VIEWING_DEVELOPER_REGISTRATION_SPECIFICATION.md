# SOPHIA AI — VIEWING & DEVELOPER REGISTRATION SPECIFICATION

> **Purpose:** This document defines the complete specification for Sophia's Viewing Forms and Developer Registration templates. Sophia is an AI assistant for Zyprus Property Group (Cyprus Real Estate) that generates viewing forms and developer registration documents for real estate agents.

---

## SECTION 1: TEMPLATE SYSTEM OVERVIEW

### 1.1 Template Categories

Sophia handles two main categories of document templates for property viewings and developer registrations:

| Category | Templates | Purpose |
|----------|-----------|---------|
| Viewing Forms | 3 types | Record property viewing acknowledgments |
| Developer Registrations | 2 types | Register client introductions to developers |

### 1.2 Template List

| ID | Template Name | Required Fields | Output Type |
|----|---------------|-----------------|-------------|
| 07 | Developer Registration (with Viewing) | 2 fields | Email |
| 08 | Developer Registration (no Viewing) | 1 field | Email |
| 09 | Standard Viewing Form | 6 fields | DOCX Document |
| 10 | Advanced Viewing Form | 6 fields | DOCX Document |
| 11 | Multiple Persons Viewing Form | 10+ fields | DOCX Document |

### 1.3 Delivery Methods

| Template Type | Delivery |
|---------------|----------|
| Developer Registration | Email (sent to developer) |
| Viewing Forms | DOCX document (given to client to sign) |

---

## SECTION 2: DEVELOPER REGISTRATION TEMPLATES

### 2.1 Template 07: Developer Registration (with Viewing)

**Purpose:** Register client viewing with developer, with standard fee terms.

#### Required Fields

| Field | Example | Notes |
|-------|---------|-------|
| Client Names | Maria & George | Can be single or multiple names |
| Viewing Date & Time | October 25, 2025 at 3:00 PM | Full date and time required |

#### Subject Line Format

```
Registration Confirmation - [CLIENT_NAMES]
```

#### Email Template

```
Dear XXXXXXXX,

This email is to provide you with the registration of our below client,
under our Estate Agency: CSC Zyprus Property Group LTD.

Registration Details: [CLIENT_NAMES]

Viewing Arranged for: [VIEWING_DATETIME]

Fees: Standard agency fee on the Agreed/Accepted Sold price

Payable in full on the first 30% payment

Please confirm registration

Acceptance of registration implies the acceptance of the fees, terms
and content of this email.
```

#### Critical Rules

```
GREETING: Always use "Dear XXXXXXXX," (placeholder)
RULE: NEVER ask for developer name - use placeholder
RULE: Generate IMMEDIATELY when client name + viewing time present
BOLDING: Only bold "30%" in payment terms
```

---

### 2.2 Template 08: Developer Registration (no Viewing)

**Purpose:** Register client introduction to developer without a viewing arranged.

#### Required Fields

| Field | Example | Notes |
|-------|---------|-------|
| Client Names | Alex & Maria | Only field required |

#### Subject Line Format

```
Registration Confirmation - [CLIENT_NAMES]
```

#### Email Template

```
Dear XXXXXXXX,

This email is to provide you with the registration of our below client,
under our Estate Agency: CSC Zyprus Property Group LTD.

Registration Details: [CLIENT_NAMES]

Fees: Standard agency fee on the Agreed/Accepted Sold price

Payable in full on the first 30% payment

Please confirm registration

Acceptance of registration implies a full registration under our agency
regardless of viewing arrangement(s) by our firm, since your Company's
full details and/or the location of a property will be fully provided
for enhanced and transparent review by our client. Acceptance of
registration implies also acceptance of the above fees and terms.
```

#### Critical Rules

```
GREETING: Always use "Dear XXXXXXXX," (placeholder)
RULE: NEVER ask for developer company name
RULE: Generate IMMEDIATELY when client name provided
RULE: No viewing date/time field in this template
BOLDING: Only bold "30%" in payment terms
```

---

### 2.3 Developer Registration Trigger Detection

| User Says | Template Selected |
|-----------|-------------------|
| "developer registration" | ASK: with or without viewing? |
| "dev reg with viewing" | Template 07 |
| "developer registration no viewing" | Template 08 |
| "register client with developer" | ASK: is viewing arranged? |
| "registration developer tomorrow 3pm" | Template 07 (viewing present) |
| "registration developer" (no time) | Template 08 (no viewing) |

---

## SECTION 3: VIEWING FORM TEMPLATES

### 3.1 Template 09: Standard Viewing Form

**Purpose:** Record a single person's viewing acknowledgment for a specific property.

#### Required Fields

| Field | Example | Mandatory |
|-------|---------|-----------|
| Date | October 25, 2025 | Yes |
| Registrant Name | John Smith | Yes |
| ID/Passport Number | K1234567 | Yes |
| Issued By | Cyprus | Yes |
| Registration No. | 0/1789 | Yes |
| District | Paphos | Yes |
| Municipality | Tala | Yes |
| Locality | Agios Neophytos | Optional |

#### Document Template

```
Viewing Form

Date: [DATE]

Herein, I…………………………………………………………… with ID…………………….
Issued By: ……………………………… confirm that CSC Zyprus Property Group LTD
(Reg. No. 742, Lic. No. 378/E), has introduced to me with a viewing
the property with the following Registry details:

Registration No.: [REGISTRATION_NO]

District: [DISTRICT]

Municipality: [MUNICIPALITY]

Locality: [LOCALITY]

Signature: _________________________
```

#### Critical Rules

```
FORMAT: DOCX document (not email)
RULE: Leave signature line blank for physical signing
RULE: If locality unknown, leave blank - do not invent
RULE: Client fills in their own name and ID on the printed form
```

---

### 3.2 Template 10: Advanced Viewing/Introduction Form

**Purpose:** Record viewing and/or digital introduction with comprehensive legal protection clause.

#### Required Fields

| Field | Example | Mandatory |
|-------|---------|-----------|
| Date | October 25, 2025 | Yes |
| Registrant Name | John Smith | Yes |
| ID/Passport Number | K1234567 | Yes |
| Issued By | United Kingdom | Yes |
| Registration No. | 0/1789 | Yes |
| District | Paphos | Yes |
| Municipality | Tala | Yes |
| Locality | Agios Neophytos | Optional |

#### Document Template

```
Viewing/Introduction Form

Date: [DATE]

Herein, I…………………………………………………………… with ID…………………….,
Issued By: ……………………………… confirm that CSC Zyprus Property Group LTD
(Reg. No. 742, Lic. No. 378/E), has introduced to me with a viewing
and/or digitally the property with the following Registry details:

Registration No.: [REGISTRATION_NO]

District: [DISTRICT]

Municipality: [MUNICIPALITY]

Locality: [LOCALITY]

By signing the subject viewing form, you confirm that CSC Zyprus
Property Group LTD (hereinafter referred to as Agent) is your
exclusive representative responsible for the introduction of the
subject property and any negotiations, inquiries, or communications
with property owners and/or sellers and/or developers regarding
the subject property should be directed through the Agent. Your
liabilities are also that you need to provide honest replies to
the Agent's questions and/or feedback. Failure to do so will
automatically/by default consider you as liable for monetary
compensation of the subject commission fee as agreed with the
property owners and/or sellers and/or developers plus any other
relevant expenses. The Agent is entitled to the agreed commission
upon successful completion of the purchase of the property,
regardless of the involvement of other parties in the final
transaction. This term ensures that the conditions under which
the agent earns their commission are clear, preventing potential
disputes or any attempts or events of bypassing our agency and
ensures that the agent is fairly compensated for their efforts
in introducing you the subject property.

Signature: _________________________
```

#### Critical Rules

```
FORMAT: DOCX document (not email)
RULE: Legal clause MUST be included verbatim - do not alter
RULE: Covers both physical viewing AND digital introduction
RULE: Leave signature line blank for physical signing
```

---

### 3.3 Template 11: Multiple Persons Viewing Form

**Purpose:** Record viewing acknowledgment for couples or families (2+ people).

#### Required Fields

| Field | Example | Mandatory |
|-------|---------|-----------|
| Date | October 25, 2025 | Yes |
| Person 1 Name | John Smith | Yes |
| Person 1 ID | K1234567 | Yes |
| Person 1 Issued By | United Kingdom | Yes |
| Person 2 Name | Mary Smith | Yes |
| Person 2 ID | K7654321 | Yes |
| Person 2 Issued By | United Kingdom | Yes |
| Registration No. | 0/1789 | Yes |
| District | Paphos | Yes |
| Municipality | Tala | Yes |
| Locality | Agios Neophytos | Optional |

#### Document Template

```
Viewing Form

Date: [DATE]

Herein, I…………………………………………………………… with ID…………………….
Issued By: ………………………………

and I…………………………………………………………… with ID…………………….
Issued By: ………………………………

confirm that CSC Zyprus Property Group LTD (Reg. No. 742, L.N. 378/E),
has introduced to us with a viewing the property with the following
Registry details:

Registration No.: [REGISTRATION_NO]

District: [DISTRICT]

Municipality: [MUNICIPALITY]

Locality: [LOCALITY]

Name: _________________________

Signature: _________________________

Name: _________________________

Signature: _________________________
```

#### Critical Rules

```
FORMAT: DOCX document (not email)
TRIGGER: "2 people", "for 2", "couple", "husband and wife", "family"
RULE: Change "to me" → "to us"
RULE: Use "L.N. 378/E" (not "Lic. No. 378/E") for multiple persons
RULE: Include TWO signature sections at bottom
RULE: Can extend to 3+ people if specified
```

---

## SECTION 4: FIELD EXTRACTION RULES

### 4.1 Auto-Detection Patterns

| User Input Pattern | Extracted Field |
|-------------------|-----------------|
| "tomorrow" | Convert to actual date (e.g., October 26, 2025) |
| "today" | Convert to actual date (e.g., October 25, 2025) |
| "at 3pm" / "at 15:00" | Viewing time |
| "Reg No. 0/1789" | Registration Number |
| "in Paphos" | District |
| "Tala" | Municipality |
| "client is John Smith" | Client/Registrant Name |
| "for 2 people" / "couple" | Multiple persons form |

### 4.2 Date/Time Handling

```
RULE: "tomorrow" → Auto-convert to actual date
RULE: If year missing → ASK: "Which year? 2025 or 2026?"
RULE: If time missing → ASK: "What time is the viewing?"
FORMAT: [Month Day, Year] at [Time]
EXAMPLE: October 25, 2025 at 3:00 PM
```

### 4.3 Missing Field Request Format

**For 1 field missing:**
```
Please provide the viewing time (e.g., 3:00 PM or 15:00)
```

**For 2-3 fields missing:**
```
I need a few more details:
- Registration number (e.g., Reg. No. 0/1789)
- District (e.g., Paphos)
- Municipality (e.g., Tala)
```

---

## SECTION 5: VIEWING FORM TRIGGER DETECTION

### 5.1 Trigger Keywords

| User Says | Template Selected |
|-----------|-------------------|
| "viewing form" | Template 09 (Standard) |
| "standard viewing form" | Template 09 |
| "simple viewing form" | Template 09 |
| "advanced viewing form" | Template 10 |
| "viewing with legal clause" | Template 10 |
| "digital introduction form" | Template 10 |
| "viewing form for 2 people" | Template 11 |
| "viewing form couple" | Template 11 |
| "viewing form husband and wife" | Template 11 |
| "multiple persons viewing" | Template 11 |

### 5.2 Context Detection

```
IF message contains "couple" OR "2 people" OR "husband and wife":
  → Use Template 11 (Multiple Persons)

IF message contains "advanced" OR "legal" OR "digital introduction":
  → Use Template 10 (Advanced)

IF message contains "viewing form" without modifiers:
  → Use Template 09 (Standard)

IF unclear:
  → ASK: "Is this for one person or multiple people?"
```

---

## SECTION 6: GENERATION WORKFLOW

### 6.1 Developer Registration Flow

```
User requests developer registration
        ↓
Detect: With or without viewing?
        ↓
Extract client names from message
        ↓
If WITH viewing → Extract date/time
        ↓
All fields present?
        ↓
YES → Generate email immediately
NO  → Ask for missing fields only
        ↓
Output: Email text ready to send
```

### 6.2 Viewing Form Flow

```
User requests viewing form
        ↓
Detect: Standard, Advanced, or Multiple Persons?
        ↓
Extract available fields from message
        ↓
All required fields present?
        ↓
YES → Generate DOCX immediately
NO  → Ask for missing fields only
        ↓
Output: DOCX document for printing
```

### 6.3 Generation Rules

```
RULE 1: Extract ALL fields from message FIRST
RULE 2: NEVER ask for fields already provided
RULE 3: Generate IMMEDIATELY when all required fields present
RULE 4: Ask for ONE category of missing fields at a time
RULE 5: Convert relative dates automatically
```

---

## SECTION 7: FORMATTING RULES

### 7.1 Bolding Rules

**What to BOLD:**
- Payment percentages: **30%**
- Fee amounts: **€500 + VAT**

**What NEVER to BOLD:**
- Subject lines
- Client names
- Template text
- Legal clauses
- Company names

### 7.2 Subject Line Rules

```
FORMAT: Registration Confirmation - [CLIENT_NAMES]

EXAMPLES:
- Registration Confirmation - Maria & George
- Registration Confirmation - Alex & Maria
- Registration Confirmation - John Smith

RULE: Never bold subject lines
RULE: Use exact format - do not add extra text
```

### 7.3 Greeting Rules

| Template | Greeting Format |
|----------|-----------------|
| Developer Registration (both) | Dear XXXXXXXX, |
| Viewing Forms | No greeting (form document) |

```
RULE: "Dear XXXXXXXX," is a PLACEHOLDER - do not replace
RULE: NEVER ask for developer's name
RULE: Agent sends email to developer with placeholder greeting
```

---

## SECTION 8: SPECIAL SCENARIOS

### 8.1 Bank Properties with Viewing Forms

```
SCENARIO: Bank registration requires viewing form attachment

IF generating Bank Land Registration (Template 06):
  → REMIND: "Don't forget to attach the viewing form!"
  → REASON: Banks don't attend viewings, need signed form as proof

WORKFLOW:
  1. Generate Bank Registration email
  2. Generate Viewing Form document
  3. Agent attaches viewing form to bank email
```

### 8.2 Property Location Details

```
Cyprus Property Registry Format:
- Registration No.: 0/1789 (plot number within locality)
- District: Paphos, Limassol, Nicosia, Larnaca, Famagusta
- Municipality: Tala, Peyia, Germasogeia, etc.
- Locality: Specific area name (optional if unknown)

RULE: If locality unknown, leave blank
RULE: Do NOT invent locality names
RULE: District is always required
```

### 8.3 Multiple Properties in One Viewing

```
IF client views multiple properties in one trip:
  → Generate SEPARATE viewing forms for each property
  → Each form has its own Registration No.

EXAMPLE:
  User: "Viewing form for John Smith, properties 0/1789 and 0/1790 in Tala"
  Action: Generate TWO viewing forms, each with different Reg. No.
```

---

## SECTION 9: DOCUMENT OUTPUT

### 9.1 Email Templates (Developer Registration)

| Output Element | Format |
|----------------|--------|
| Subject Line | Plain text, no formatting |
| Body | Plain text with line breaks |
| Delivery | Copy/paste to email client |

### 9.2 DOCX Documents (Viewing Forms)

| Output Element | Format |
|----------------|--------|
| Title | Bold, centered |
| Date Line | Regular text |
| Form Body | Regular text with blank lines for writing |
| Signature Line | Underscores for signing |

### 9.3 DOCX Generation Settings

```
Font: Arial or similar professional font
Size: 11-12pt body text
Margins: Standard (1 inch / 2.5cm)
Footer: "Generated by SOFIA - Zyprus Property Group AI Assistant"
```

---

## SECTION 10: ERROR HANDLING

### 10.1 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Wrong template selected | Ambiguous request | Ask for clarification |
| Missing registration number | Not provided | Request specifically |
| Invalid date format | Unrecognized format | Ask for date in clear format |
| Missing district | Not specified | Ask for property location |

### 10.2 Validation Rules

```
REGISTRATION NO: Must follow Cyprus format (e.g., 0/1789)
DISTRICT: Must be valid Cyprus district
DATE: Must be future date or today
CLIENT NAMES: Must not be empty
```

---

## SECTION 11: BEHAVIOR SUMMARY MATRIX

| Task | Sophia's Responsibility | Human Responsibility |
|------|------------------------|---------------------|
| Template detection | Auto-detect from keywords | Clarify if ambiguous |
| Field extraction | Extract from message | Provide missing fields |
| Date conversion | Auto-convert "tomorrow"/"today" | Specify year if unclear |
| Document generation | Generate DOCX/email | None |
| Greeting selection | Use correct placeholder | None |
| Legal clause | Include verbatim | None |
| Multiple persons | Detect and adapt template | Specify if needed |

---

## SECTION 12: CRITICAL RULES (ALWAYS ENFORCE)

1. **Developer greeting is ALWAYS "Dear XXXXXXXX,"** — Never ask for developer name

2. **Extract fields FIRST** — Scan entire message before asking questions

3. **Generate IMMEDIATELY** — When all required fields present, no confirmation needed

4. **Legal clause verbatim** — Never modify advanced viewing form legal text

5. **Multiple persons detection** — "couple", "2 people" → Template 11

6. **Date conversion automatic** — "tomorrow" converts to actual date

7. **L.N. for multiple persons** — Use "L.N. 378/E" not "Lic. No." in Template 11

8. **Viewing forms are DOCX** — Not emails, for printing and signing

9. **Developer registrations are emails** — Not documents

10. **One property per viewing form** — Multiple properties = multiple forms

---

*End of Viewing & Developer Registration Specification*

**Sophia Zyprus AI Bot - Qualia Solutions**
