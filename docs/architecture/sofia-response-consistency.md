# Sofia Response Consistency Architecture

## Problem Statement

Sofia's responses vary inconsistently across different LLM models (Claude Haiku, Claude Sonnet, GPT-4o), creating an unpredictable user experience. When asked for missing information, different models respond differently:

- Claude Haiku: "I'd be happy to help you create a registration!"
- Claude Sonnet: "Sure! Let me assist you with that."
- GPT-4o: "I can help with that registration."

**Desired Behavior**: Consistent, professional responses regardless of model:
```
Please provide:

Please provide the property’s registration information (e.g., Reg. No. 0/1789 Germasogeia, Limassol OR Limas Building Flat No. 103 Tala, Paphos)

Please provide the marketing price (e.g., €350,000)
```

## Root Cause Analysis

### 1. Prompt Complexity
- Current system prompt: **2,442 lines** of instructions
- Mixed priorities and conflicting rules
- No clear hierarchy of requirements

### 2. Model Interpretation Variance
- Each LLM interprets "professional" differently
- Natural language instructions lead to varied implementations
- Models inject their trained personality patterns

### 3. No Enforcement Mechanism
- No validation layer for responses
- No post-processing to ensure compliance
- Temperature=0 still allows variation in phrasing

## Solution Architecture

### Three-Layer Enforcement System

```
┌─────────────────────────────────────────┐
│   Layer 1: Prompt-Level Enforcement     │
│   - Mandatory response formats          │
│   - Forbidden phrases list              │
│   - Model-specific adjustments          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Layer 2: Response Validation          │
│   - Pattern matching validation         │
│   - Format compliance checking          │
│   - Violation detection                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Layer 3: Post-Processing              │
│   - Remove non-compliant elements       │
│   - Enforce standard formats            │
│   - Clean up model artifacts            │
└─────────────────────────────────────────┘
```

## Implementation Details

### 1. Enhanced Prompt Structure (`lib/ai/prompts.ts`)

The prompt now follows this hierarchy:

```
1. MANDATORY RESPONSE FORMAT (Highest Priority)
   └── Exact templates for field requests
   └── Direct document generation rules
   └── Forbidden phrases list

2. FIELD EXTRACTION RULES
   └── Pattern matching for client names
   └── Time conversion (3pm → 15:00)
   └── Template detection

3. SOFIA BASE INSTRUCTIONS
   └── Original 2,442-line instructions
   └── Template definitions
   └── Business logic
```

### 2. Response Enforcer Module (`lib/ai/response-enforcer.ts`)

**Core Components:**

#### A. Response Templates
```typescript
FIELD_REQUEST: {
  format: `Please provide:
  {FIELD_1} (e.g., {EXAMPLE_1})
  {FIELD_2} (e.g., {EXAMPLE_2})`,
  rules: [
    'ALWAYS start with "Please provide:"',
    'Each field on NEW LINE with blank line between',
    'NO additional text or explanations'
  ]
}
```

#### B. Forbidden Patterns
```typescript
const FORBIDDEN_PATTERNS = [
  /I'd be happy to/i,
  /Sure!/i,
  /Let me assist/i,
  /Here is your/i,
  // ... 20+ patterns
];
```

#### C. Model-Specific Adjustments
```typescript
'claude-haiku': `Use EXACTLY "Please provide:" format`,
'gpt-4o': `Start with "Please provide:" ALWAYS`
```

### 3. Response Validation Pipeline

```typescript
function validateResponse(response: string): ValidationResult {
  // 1. Check forbidden patterns
  // 2. Validate structure
  // 3. Ensure compliance
  return { isValid, violations };
}

function cleanResponse(response: string): string {
  // 1. Remove pleasantries
  // 2. Strip explanations
  // 3. Format consistently
  return cleanedResponse;
}
```

## Configuration by Model

### Claude Models (Haiku, Sonnet)
- Emphasis on exact format compliance
- No conversational openers
- Direct document output

### GPT Models (4o, 4o-mini)
- Strict "Please provide:" enforcement
- Zero explanatory text
- No "Here is" phrases

## Response Format Examples

### ✅ CORRECT Formats

**Single Field Request:**
```
Please provide property registration number (e.g., 0/1789)
```

**Multiple Fields Request:**
```
Please provide:

Please provide the property’s registration information (e.g., Reg. No. 0/1789 Germasogeia, Limassol OR Limas Building Flat No. 103 Tala, Paphos)

Please provide the marketing price (e.g., €350,000)

Client name (e.g., John Smith)
```

**Document Generation:**
```
Subject: Registration – John Smith – Reg No. 0/1789 – Paphos

Dear XXXXXXXX,

This email is to provide you with a registration.
[Document continues directly...]
```

### ❌ INCORRECT Formats

```
I'd be happy to help you create a registration!
Please provide the following information:
```

```
Sure! To proceed, I'll need:
```

```
Here is your generated document:
```

## Testing & Validation

### Unit Tests Required

1. **Field Request Formatting**
   - Test 1 field, 2 fields, 3+ fields scenarios
   - Verify line breaks and spacing
   - Check example format

2. **Forbidden Pattern Detection**
   - Test all 20+ forbidden phrases
   - Case insensitive matching
   - Partial phrase detection

3. **Model-Specific Behavior**
   - Test each model configuration
   - Verify consistent output
   - Check edge cases

### Integration Tests

1. **End-to-End Flow**
   ```
   User: "registration developer the client is John Smith"
   Expected: Extract fields → Generate document directly
   NOT: "I can help with that registration!"
   ```

2. **Multi-Turn Consistency**
   - First response format matches subsequent ones
   - No degradation over conversation
   - Maintains professional tone

## Monitoring & Metrics

### Key Performance Indicators

1. **Response Consistency Rate**
   - Target: 99%+ identical format across models
   - Measure: Pattern matching on responses

2. **Forbidden Phrase Violations**
   - Target: <1% occurrence
   - Alert on any detection

3. **User Experience Metrics**
   - Reduced confusion from inconsistent responses
   - Faster task completion (fewer clarifications needed)
   - Professional perception maintained

### Logging Requirements

```typescript
// Log validation failures
if (!validation.isValid) {
  console.warn('Response validation failed', {
    model: selectedChatModel,
    violations: validation.violations,
    response: response.substring(0, 100)
  });
}
```

## Deployment Strategy

### Phase 1: Soft Launch
- Deploy enhanced prompts
- Monitor without post-processing
- Collect baseline metrics

### Phase 2: Validation Layer
- Enable response validation
- Log violations without blocking
- Analyze patterns

### Phase 3: Full Enforcement
- Enable post-processing
- Clean all responses
- Ensure 100% compliance

## Maintenance & Updates

### Adding New Forbidden Phrases
1. Add to `FORBIDDEN_PATTERNS` array
2. Add test case
3. Deploy and monitor

### Adjusting Response Templates
1. Update in `RESPONSE_TEMPLATES`
2. Test all affected flows
3. Update documentation

### Model-Specific Tuning
1. Monitor new model behavior
2. Add specific adjustments if needed
3. Test cross-model consistency

## Success Criteria

1. **Identical Responses**: Same input → same output format across all models
2. **Zero Pleasantries**: No "I'd be happy to" or similar phrases
3. **Professional Tone**: Direct, efficient communication
4. **Field Extraction**: 100% accuracy on provided information
5. **Document Generation**: Immediate output when all fields present

## Future Enhancements

1. **Machine Learning Approach**
   - Train custom classifier for response validation
   - Fine-tune models on Sofia's exact format

2. **A/B Testing Framework**
   - Test format variations
   - Measure user preference

3. **Automatic Adjustment**
   - Self-correcting based on violations
   - Dynamic prompt optimization

## Conclusion

This architecture ensures Sofia maintains consistent, professional communication regardless of the underlying LLM model. By implementing strict format enforcement at multiple layers, we guarantee a predictable user experience that aligns with business requirements.

The solution is:
- **Robust**: Multiple enforcement layers
- **Maintainable**: Clear separation of concerns
- **Scalable**: Easy to add new models
- **Measurable**: Built-in monitoring

With this system, Sofia will always respond with:
```
Please provide:

[Required fields with examples]
```

Never with:
```
I'd be happy to help! Let me assist you...
```

This consistency builds trust and efficiency in the real estate document generation workflow.