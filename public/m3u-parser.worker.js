importScripts("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");

function isAdultContent(title, category) {
  const block = /(adult|porno|xxx|sex|18\+)/i;
  return block.test(title) || block.test(category);
}

function normalizeTitle(title) {
  return title.replace(/\s*\(?4k\)?/i, "").trim().toLowerCase();
}

// Detectar se é série pelo padrão S01E01 ou 1x01
function isSeries(title) {
  const patterns = [
    /\s+[Ss]\d{1,2}[Ee]\d{1,2}/, // S01E01
    /\s+\d{1,2}[xX]\d{1,2}/, // 1x01
    /temporada\s*\d+/i, // Temporada 1
    /season\s*\d+/i, // Season 1
  ];
  return patterns.some(pattern => pattern.test(title));
}

function parseM3U(content, source) {
  const lines = content.split(/\r?\n/);
  let current = {};
  const seen = new Map();

  for (const line of lines) {
    if (line.startsWith("#EXTINF:")) {
      const title = line.split(/,(.+)/)[1]?.trim() || "Sem título";
      const image = line.match(/tvg-logo="([^"]*)"/)?.[1] || "";
      const category = line.match(/group-title="([^"]*)"/)?.[1] || "Sem Categoria";

      // Detectar automaticamente se é série ou filme
      const detectedSource = isSeries(title) ? "series" : source;

      current = { title, image, category, source: detectedSource };
    } else if (line && !line.startsWith("#")) {
      current.url = line.trim();
      current.id = `${current.title}-${current.url}`;

      if (isAdultContent(current.title, current.category)) {
        current = {};
        continue;
      }

      const key = normalizeTitle(current.title);

      // Para séries, não filtrar duplicatas (cada episódio é único)
      // Para filmes, manter lógica de 4k
      if (current.source === "series") {
        postMessage({ status: "item", item: current });
      } else {
        if (!seen.has(key) || /4k/i.test(current.title)) {
          seen.set(key, current);
          postMessage({ status: "item", item: current });
        }
      }

      current = {};
    }
  }
}

self.onmessage = async (e) => {
  const { file, type } = e.data;

  try {
    postMessage({ status: "progress", message: "Processando arquivo..." });

    let text = "";

    if (file.name.endsWith(".zip")) {
      const zip = await JSZip.loadAsync(file);
      const m3u = Object.values(zip.files).find(
        (f) => !f.dir && f.name.match(/\.m3u8?$/i)
      );
      if (!m3u) throw new Error("ZIP sem arquivo M3U");
      text = await m3u.async("string");
    } else {
      text = await file.text();
    }

    parseM3U(text, type);
    postMessage({ status: "done" });
  } catch (err) {
    postMessage({
      status: "error",
      message: err.message || "Erro no parser",
    });
  }
};