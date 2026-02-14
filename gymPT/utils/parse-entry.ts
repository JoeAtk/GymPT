import { LiftEntry } from './chat-log';

// Parse a free-text workout entry using the Generative Language API.
export async function parseLiftEntry(freeText: string, apiKey: string): Promise<LiftEntry> {
  // Build a prompt instructing the model to output strict JSON
  const prompt = `You are a parser that extracts a single workout lift entry from user text.
Return ONLY a JSON object with these fields: name (string), sets (integer), reps (integer), weight (number or null), timestamp (millis since epoch or null), weightUnit ("kg" or "lb" or null).
If a field is unknown, set it to null. Do not include any extra commentary.

Text:\n${freeText}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') ||
    '';

  // Attempt to extract JSON object from the model's response
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1) {
    throw new Error('Parser did not return JSON');
  }

  const jsonStr = text.slice(first, last + 1);
  let parsed: any = null;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('Failed to parse JSON from parser response');
  }

  const entry: LiftEntry = {
    name: String(parsed.name ?? '').trim() || 'Unknown',
    sets: parsed.sets ? Number(parsed.sets) : 1,
    reps: parsed.reps ? Number(parsed.reps) : 1,
    weight: parsed.weight ? Number(parsed.weight) : undefined,
    timestamp: parsed.timestamp ? Number(parsed.timestamp) : Date.now(),
  };

  return entry;
}
