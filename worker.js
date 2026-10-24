const genres = ["Action", "Comedy", "Crime", "Mystery", "Thriller", "War", "Western"];

const manifest = {
  id: "com.peeps.catalog",
  version: "1.0.0",
  name: "Peeps Catalog",
  description: "Seven personalized movie genre catalogs",
  resources: ["catalog"],
  types: ["movie"],
  catalogs: genres.map(genre => ({
    type: "movie",
    id: "peeps-" + genre.toLowerCase(),
    name: "Peeps - " + genre,
    extra: [{ name: "skip", isRequired: false }]
  }))
};

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/manifest.json") {
      return new Response(JSON.stringify(manifest), { headers });
    }

    const match = url.pathname.match(
      /^\/catalog\/movie\/peeps-([a-z]+)(?:\/([^/]+))?\.json$/
    );

    if (match) {
      const genre = genres.find(g => g.toLowerCase() === match[1]);
      if (!genre) {
        return new Response(JSON.stringify({ metas: [] }), { headers });
      }

      const extra = new URLSearchParams(match[2] || "");
      const skip = Math.max(
        0,
        Math.min(10000, parseInt(extra.get("skip") || "0", 10) || 0)
      );

      const source = "https://v3-cinemeta.strem.io/catalog/movie/top/genre=" +
        encodeURIComponent(genre) + "&skip=" + skip + ".json";

      try {
        const result = await fetch(source);
        if (!result.ok) throw new Error("Catalog source unavailable");
        const data = await result.json();

        return new Response(JSON.stringify({ metas: data.metas || [] }), {
          headers: { ...headers, "Cache-Control": "public, max-age=1800" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ metas: [] }), {
          status: 502,
          headers
        });
      }
    }

    return new Response("Peeps Catalog: open /manifest.json", {
      headers: { "Content-Type": "text/plain" }
    });
  }
};
