import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 120; // Allow up to 2 minutes for Vercel

const SYSTEM_PROMPT = `You are an order comparison specialist. You will receive two PDF documents:

1. CUSTOMER PURCHASE ORDER (PO) — the original order from the customer
2. ENTERED ORDER — the order as entered into the company's system

Your job is to extract ALL line items and header information from both documents and compare them meticulously.

RESPOND ONLY WITH VALID JSON (no markdown, no backticks, no explanation). Use this exact schema:

{
  "summary": {
    "totalCustomerItems": <number>,
    "totalEntryItems": <number>,
    "matches": <number>,
    "warnings": <number>,
    "errors": <number>,
    "missing": <number>,
    "extras": <number>
  },
  "headerComparison": [
    {
      "field": "<field name like PO Number, Date, Ship To, Bill To, etc>",
      "customerValue": "<value from customer PO>",
      "entryValue": "<value from entered order>",
      "match": <true/false>,
      "matchRequired": <true/false>
    }
  ],
  "lineItems": [
    {
      "status": "<match|mismatch|warning|missing_from_entry|extra_in_entry>",
      "customerItem": {
        "lineNumber": <number>,
        "partNumber": "<string>",
        "description": "<string>",
        "quantity": "<number or string>",
        "unitPrice": "<number or string>",
        "total": "<number or string>",
        "uom": "<unit of measure if present>"
      },
      "entryItem": {
        "lineNumber": <number>,
        "partNumber": "<string>",
        "description": "<string>",
        "quantity": "<number or string>",
        "unitPrice": "<number or string>",
        "total": "<number or string>",
        "uom": "<unit of measure if present>"
      },
      "issues": ["<description of each issue>"]
    }
  ],
  "recommendations": ["<actionable recommendation>"],
  "overallStatus": "<pass|review|fail>"
}

MATCHING RULES:
- "match": All fields match exactly (part number, qty, price, description)
- "warning": Minor differences (slight description wording, rounding differences in price)
- "mismatch": Significant differences (wrong part number, wrong quantity, wrong price)
- "missing_from_entry": Item in customer PO but not in entered order (set entryItem to null)
- "extra_in_entry": Item in entered order but not in customer PO (set customerItem to null)

STATUS RULES:
- "pass": All items match or have only minor warnings
- "review": Some warnings that need human review
- "fail": Any mismatches, missing items, or significant errors

Be thorough. Check EVERY line item. If you cannot read a value, note it as "UNREADABLE" and flag it as a warning.
For prices, compare the actual numbers — $10.00 and $10 are the same.
For part numbers, be exact — even a single character difference is a mismatch.
IMPORTANT: For the PO Number header field, the entry system (Acumatica) does not allow dashes or spaces. When comparing PO Numbers, strip all dashes and spaces from both values before comparing. If the remaining alphanumeric characters match in the same order, mark as "match": true. For example, "3009421-00" and "300942100" should be a match. Also ignore case differences in PO Numbers.
For quantities, exact match required.
Compare any header fields you can find: PO number, dates, ship-to, bill-to, payment terms, etc.
IMPORTANT: Order dates frequently differ between the customer PO and the entered order (e.g. the PO date vs. the entry date). For date fields, set "matchRequired": false and compare the actual values — set "match": true if they are the same, "match": false if they differ. Do NOT count date mismatches toward errors or affect overallStatus.
IMPORTANT: Payment terms (e.g. "Net 30", "Freight Prepaid & Add", etc.) frequently differ between the customer PO and the entered order. For terms fields, set "matchRequired": false and compare the actual values — set "match": true if they are the same, "match": false if they differ. Do NOT count terms mismatches toward errors or affect overallStatus.
For all other header fields (PO Number, Ship To, Bill To, Contact, Total Amount, etc.), set "matchRequired": true.`;

export async function POST(request: NextRequest) {
  try {
    const { customerPdf, entryPdf } = await request.json();

    if (!customerPdf || !entryPdf) {
      return NextResponse.json({ error: 'Both PDF files are required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured. Add it to your Vercel environment variables.' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const MAX_RETRIES = 3;
    let response;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        response = await client.messages.create({
          model: 'claude-opus-4-20250514',
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: customerPdf,
                  },
                  cache_control: { type: 'ephemeral' },
                },
                {
                  type: 'text',
                  text: 'Above is the CUSTOMER PURCHASE ORDER.',
                },
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: entryPdf,
                  },
                  cache_control: { type: 'ephemeral' },
                },
                {
                  type: 'text',
                  text: 'Above is the ENTERED ORDER. Now compare both documents thoroughly and return the JSON comparison result.',
                },
              ],
            },
          ],
        });
        break; // Success, exit retry loop
      } catch (retryErr: any) {
        const status = retryErr?.status || retryErr?.statusCode;
        if (status === 529 && attempt < MAX_RETRIES - 1) {
          // Overloaded — wait and retry
          await new Promise((r) => setTimeout(r, (attempt + 1) * 3000));
          continue;
        }
        throw retryErr;
      }
    }

    if (!response) {
      return NextResponse.json({ error: 'Claude is currently overloaded. Please try again in a moment.' }, { status: 529 });
    }

    // Extract text from response
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse JSON — handle potential markdown wrapping
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Compare API error:', err);

    if (err.message?.includes('JSON')) {
      return NextResponse.json(
        { error: 'AI response was not valid JSON. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
