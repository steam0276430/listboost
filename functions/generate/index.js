export async function onRequestGet(context) {
  return new Response("route generate OK");
}

export async function onRequestPost(context) {
  return new Response("POST OK");
}

