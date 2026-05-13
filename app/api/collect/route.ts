import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { collectionAddress, tokenId, chainId, amount, comment } = body;

    const apiKey = process.env.INPROCESS_API_KEY;
    if (!apiKey) {
      // No API key — return error so frontend can fallback to openUrl
      return NextResponse.json({ error: "no_api_key" }, { status: 400 });
    }

    const res = await fetch("https://api.inprocess.world/api/moment/collect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        moment: {
          collectionAddress,
          tokenId,
          chainId: chainId || 8453,
        },
        amount: amount || 1,
        comment: comment || "",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data?.message || "Collect failed" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
