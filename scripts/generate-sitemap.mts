import { glob } from "glob";
import { writeFileSync, lstatSync } from "fs";

async function main() {
    const excluded: string[] = [];
    const pages = await glob("app/**/page.{tsx,md,mdx}");
    const routes = [];

    for (const page of pages) {
        let route = page
            .replace(/[\/\\]\([a-z0-9A-Z_-]+\)/gi, "")
            .replace(/^app[\/\\]/gi, "")
            .replace(/[\/\\]page\.(ts|md)x/gi, "")
            .replace(/\\/g, "/");

        route =
            route === "" ||
            route === "page.tsx" ||
            route === "page.mdx" ||
            route === "page.md"
                ? "/"
                : `/${route}`;

        if (excluded.includes(route)) {
            continue;
        }

        const lastmod = lstatSync(page).mtime;

        routes.push({
            path: route,
            file: page.replace(/\\/g, "/"),
            lastmod,
        });
    }

    const urls = routes.map(
        route =>
            "\t" +
            `
    <url>
        <loc>${route.path}</loc>
        <lastmod>${route.lastmod.toISOString()}</lastmod>
        <priority>${route.path === "/" ? "1.0" : "0.8"}</priority>
    </url>`.trim(),
    );

    const urlset = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
    `.trim();

    const json = JSON.stringify(
        routes.map(route => ({
            loc: route.path,
            lastmod: route.lastmod.toISOString(),
            priority: route.path === "/" ? 1.0 : 0.8,
        })),
    );

    writeFileSync("sitemap.xml", urlset);
    writeFileSync("sitemap.json", json);
}

main();
