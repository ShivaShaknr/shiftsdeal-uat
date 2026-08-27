export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
  
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");
  
    if (
      mode === "subscribe" &&
      token === process.env.META_VERIFY_TOKEN &&
      challenge
    ) {
      return new Response(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
  
    return new Response("Forbidden", { status: 403 });
  }
  
  export async function POST(req: Request) {
    const body = await req.json();
  
    console.log("WhatsApp webhook:", JSON.stringify(body, null, 2));
  
    return Response.json({ success: true });
  }