export async function onRequestGet() {
  return new Response("route generate OK (use POST)");
}

export async function onRequestPost(context) {
  try {
    const { prompt, platform, locale } = await context.request.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response("Missing prompt", { status: 400 });
    }

    const apiKey = context.env.OPENAI_API_KEY;
    if (!apiKey) return new Response("Server not configured", { status: 500 });

    const system = `Tu es un assistant e-commerce.
Objectif: générer une annonce ${platform === "leboncoin" ? "Leboncoin" : "Vinted"} en ${locale || "fr-FR"}.
Contraintes:
- Titre court (max 70 caractères)
- Description claire, honnête, structurée (état, défauts, livraison)
- Hashtags pertinents (10 max)
- Prix conseillé (une seule valeur) + justification très courte (1 phrase)
Retourne STRICTEMENT un JSON valide avec les clés:
title, description, hashtags (array), price_suggestion.`;

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5.1-mini",
        input: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!r.ok) {
      const errTxt = await r.text();
      return new Response(errTxt, { status: 502 });
    }

    const out = await r.json();

    const text =
      out.output_text ||
      out.output?.[0]?.content?.[0]?.text ||
      "";

    let parsed;
    try { parsed = JSON.parse(text); }
    catch {
      parsed = { title: "", description: text, hashtags: [], price_suggestion: "" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });

  } catch (e) {
    return new Response("Bad Request", { status: 400 });
  }
}

