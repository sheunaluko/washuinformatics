import { NextRequest } from "next/server";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const hipaaUrl = process.env.HIPAA_GPT5_URL;
  const hipaaKey = process.env.HIPAA_GPT5_KEY;

  if (!hipaaUrl || !hipaaKey) {
    return Response.json(
      { error: "HIPAA endpoint not configured" },
      { status: 500 }
    );
  }

  let body: string;
  try {
    body = JSON.stringify(await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const response = await fetch(hipaaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${hipaaKey}`,
      },
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json({ error: errText }, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
