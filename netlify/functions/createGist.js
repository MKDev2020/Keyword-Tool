export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const { article, tableKeywords, lsiKeywords, sectionKeywords } = await req.json();

  const gistData = {
    description: "Keyword Tool Shared Article",
    public: true,
    files: {
      "data.json": {
        content: JSON.stringify({
          article,
          tableKeywords,
          lsiKeywords,
          sectionKeywords
        })
      }
    }
  };

  const res = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GITHUB_TOKEN}`
    },
    body: JSON.stringify(gistData)
  });

  const data = await res.json();

  if (res.ok) {
    return new Response(JSON.stringify({ gistId: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } else {
    return new Response(JSON.stringify(data), { status: res.status });
  }
};
