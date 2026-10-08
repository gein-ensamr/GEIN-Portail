import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export type DriveItem = {
  id: string;
  name: string;
  folder: boolean;
  kind: string; // Drive's label, e.g. "Folder", "PDF", "Image"
};

const SECTION_ORDER = ["cours", "td", "tp", "examens", "lase9"];

// Lists a public ("anyone with the link") Drive folder without an API key,
// by parsing Google's embeddable folder view.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !/^[\w-]+$/.test(id)) {
    return NextResponse.json({ error: "Missing or invalid id param" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`, {
      next: { revalidate: 60 }, // cache 1 min — new uploads show up quickly
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Dossier inaccessible" }, { status: 502 });
    }

    const html = await res.text();

    // Each entry: <div class="flip-entry" id="entry-ID"> … <a href="…/folders/ID | …/file/d/ID"> … <div class="flip-entry-title">NAME</div>
    // Folders label their type with aria-label="Folder"; files with a thumbnail alt="PDF"
    // and/or a type icon URL ending in /type/<mime>.
    const items: DriveItem[] = [];
    for (const block of html.split('<div class="flip-entry" ').slice(1)) {
      const id = block.match(/^id="entry-([\w-]+)"/)?.[1];
      const href = block.match(/<a href="([^"]+)"/)?.[1];
      const name = block.match(/<div class="flip-entry-title">([^<]+)<\/div>/)?.[1];
      if (!id || !href || !name) continue;
      const kind =
        block.match(/aria-label="([^"]+)"/)?.[1] ??
        block.match(/alt="([^"]+)"/)?.[1] ??
        block.match(/\/type\/([\w.+/-]+)"/)?.[1] ??
        "";
      items.push({
        id,
        folder: href.includes("/folders/"),
        kind: decodeEntities(kind),
        name: decodeEntities(name).trim(),
      });
    }

    // Folders first (standard sections in study order), then alphabetical (French collation).
    const rank = (i: DriveItem) => {
      const r = SECTION_ORDER.indexOf(i.name.toLowerCase());
      return r === -1 ? SECTION_ORDER.length : r;
    };
    items.sort(
      (a, b) =>
        Number(b.folder) - Number(a.folder) ||
        rank(a) - rank(b) ||
        a.name.localeCompare(b.name, "fr", { numeric: true })
    );

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Dossier inaccessible" }, { status: 502 });
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
