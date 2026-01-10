import { NextResponse } from 'next/server';

const OPENAI_BASE = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

export async function GET() {
  const legacyVarsPresent = {
    OPENAI_KEY: !!process.env.OPENAI_KEY,
    OPENAI_TOKEN: !!process.env.OPENAI_TOKEN,
  };

  const rawKey = process.env.OPENAI_API_KEY;
  const trimmedKey = rawKey?.trim();
  const trimmedKeyChanged = Boolean(rawKey && trimmedKey && rawKey.length !== trimmedKey.length);

  if (trimmedKeyChanged) {
    console.warn('[WARN] OPENAI_API_KEY contained surrounding whitespace and was trimmed');
  }

  if (!trimmedKey) {
    return NextResponse.json(
      {
        ok: false,
        error: 'OpenAI key missing (OPENAI_API_KEY)',
        diagnostics: {
          present: false,
          length: 0,
          startsWith: null,
          last4: null,
          hasWhitespace: false,
          legacyVarsPresent,
          trimmedKeyChanged,
        },
      },
      { status: 500 }
    );
  }

  const headers = { Authorization: `Bearer ${trimmedKey}` };

  if ('OpenAI-Organization' in headers) {
    throw new Error('Unexpected OpenAI-Organization header present; aborting request');
  }
  if ('OpenAI-Project' in headers) {
    throw new Error('Unexpected OpenAI-Project header present; aborting request');
  }

  const diagnostics = {
    present: !!trimmedKey,
    length: trimmedKey.length,
    startsWith: trimmedKey.slice(0, 8),
    last4: trimmedKey.slice(-4),
    hasWhitespace: /\s/.test(trimmedKey || ''),
    legacyVarsPresent,
    trimmedKeyChanged,
  };

  try {
    const res = await fetch(`${OPENAI_BASE}/models`, { headers });
    const json = await res.json().catch(() => null);

    return NextResponse.json(
      {
        ok: res.ok,
        status: res.status,
        diagnostics,
        base: OPENAI_BASE,
        result: res.ok
          ? {
              dataCount: Array.isArray(json?.data) ? json.data.length : null,
              object: json?.object || null,
            }
          : { error: json?.error?.message || json || 'Unknown error' },
      },
      { status: res.ok ? 200 : res.status }
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e.message,
        diagnostics,
        base: OPENAI_BASE,
      },
      { status: 500 }
    );
  }
}
