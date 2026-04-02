import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: object;
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSEO({ title, description, url, image, type = "website", jsonLd }: SEOProps) {
  useEffect(() => {
    const fullTitle = `${title} | ProPicks`;
    const pageUrl = url || window.location.href;

    document.title = fullTitle;

    setMeta("description", description);
    setMeta("robots", "index, follow");

    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", pageUrl, "property");
    setMeta("og:type", type, "property");
    setMeta("og:site_name", "ProPicks", "property");
    if (image) setMeta("og:image", image, "property");

    setMeta("twitter:card", "summary_large_image", "name");
    setMeta("twitter:title", fullTitle, "name");
    setMeta("twitter:description", description, "name");
    if (image) setMeta("twitter:image", image, "name");

    setLink("canonical", pageUrl);

    const ldId = "jsonld-seo";
    let ldEl = document.getElementById(ldId);
    if (jsonLd) {
      if (!ldEl) {
        ldEl = document.createElement("script");
        ldEl.id = ldId;
        ldEl.setAttribute("type", "application/ld+json");
        document.head.appendChild(ldEl);
      }
      ldEl.textContent = JSON.stringify(jsonLd);
    } else if (ldEl) {
      ldEl.remove();
    }
  }, [title, description, url, image, type, jsonLd]);
}
