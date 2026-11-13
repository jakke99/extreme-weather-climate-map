// Extreme Weather and Climate Change Map - lived experiences of extreme weather / climate impacts in Europe.
// Static site: everything comes from data/stories.geojson. No cookies, no tracking, no localStorage.

(function () {
  "use strict";

  // Settings. Most things you'd want to change are in here.
  const CONFIG = {
    dataUrl: "data/stories.geojson",

    // OpenFreeMap styles (no API key): positron, liberty, bright
    mapStyle: "https://tiles.openfreemap.org/styles/positron",

    // Europe incl. Iceland + Svalbard, [[west, south], [east, north]]
    startBounds: [[-25, 35], [42, 80.5]],
    minZoom: 1.5,

    // "mercator" or "globe" (globe makes Svalbard look less huge)
    projection: "mercator",

    eventTypes: {
      heat:       { color: "#d62728", de: "Hitze",                en: "Heat" },
      drought:    { color: "#a6761d", de: "Dürre",                en: "Drought" },
      wildfire:   { color: "#ff7f0e", de: "Waldbrand",            en: "Wildfire" },
      heavy_rain: { color: "#17becf", de: "Starkregen",           en: "Heavy rain" },
      flood:      { color: "#1f4e9c", de: "Hochwasser",           en: "Flood" },
      storm:      { color: "#9467bd", de: "Sturm",                en: "Storm" },
      supercell:  { color: "#e377c2", de: "Superzelle",           en: "Supercell" },
      ice_snow:   { color: "#7fb3d5", de: "Eis- & Schneeverlust", en: "Ice & snow loss" },
      other:      { color: "#7f7f7f", de: "Sonstiges",            en: "Other" }
    },

    text: {
      de: {
        title: "Extremwetter- und Klimawandelkarte",
        subtitle: "Erlebte Extremwetter und Klimafolgen in Europa",
        about: "Über dieses Projekt",
        switchTo: "EN",
        articles: "Berichterstattung",
        photo: "Foto",
        loadError: "Die Einträge konnten nicht geladen werden.",
        empty: "Noch keine Einträge.",
        of: "von",
        prev: "Vorheriger Eintrag",
        next: "Nächster Eintrag"
      },
      en: {
        title: "Extreme Weather and Climate Change Map",
        subtitle: "Lived experiences of extreme weather and climate impacts in Europe",
        about: "About",
        switchTo: "DE",
        articles: "News coverage",
        photo: "Photo",
        loadError: "Could not load the entries.",
        empty: "No entries yet.",
        of: "of",
        prev: "Previous entry",
        next: "Next entry"
      }
    },

    // Text for the "About" dialog (HTML allowed)
    about: {
      de: `
        <h2>Über das Projekt</h2>
        <p>Hallo liebe Leute, wir alle erleben die letzten Jahre extreme Wettersituationen und Folgen des Klimawandels.</p>
        <p>Trotzdem habe ich das Gefühl, dass wir uns nicht so viel über unsere Erlebnisse austauschen. Das möchte ich mit diesem Projekt ändern.</p>
        <p>Ich trage hier Eindrücke und Bilder zusammen, die euer Erleben von Extremwetter darstellen. Dazu stelle ich Links zu Zeitungs-oder Fachartikeln bereit zur Einordnung.</p>
        <p>Danke fürs Mitmachen und lasst uns in Gespräche treten und sichtbar machen, wie omnipräsent der Klimawandel ist.</p>
        <h3>Datenschutz</h3>
        <p>Diese Seite setzt keine Cookies, nutzt kein Tracking und speichert nichts in deinem Browser.
        Sie wird über GitHub Pages ausgeliefert, die Kartenkacheln kommen von OpenFreeMap.
        Beide Dienste verarbeiten technisch bedingt deine IP-Adresse.</p>
        <p>Alle Geschichten und Fotos sind mit Einwilligung der Beteiligten veröffentlicht.
        Orte sind auf Stadt- oder Stadtteilebene gerundet.</p>
        <h3>Kontakt</h3>
        <p>Jakob Müller</p>
        <p><a href="mailto:jakob-mue@gmx.de">jakob-mue@gmx.de</a></p>
        <p class="small">Karte: <a href="https://maplibre.org">MapLibre GL JS</a>,
        Kartendaten © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende,
        Kacheln: <a href="https://openfreemap.org">OpenFreeMap</a>.</p>
      `,
      en: `
        <h2>About</h2>
        <p>Hi everyone, over the last few years we've all been experiencing extreme weather and the effects of climate change.</p>
        <p>Still, I have the feeling that we don't talk much about what we've been through. That's what I want to change with this project.</p>
        <p>Here I'm collecting impressions, pictures and videos that show how you've experienced extreme weather. I'm also adding links to news and scientific articles to put things into context.</p>
        <p>Thanks for taking part. Let's start talking and make visible how omnipresent climate change is.</p>
        <h3>Privacy</h3>
        <p>This site sets no cookies, uses no tracking and stores nothing in your browser.
        It is served via GitHub Pages and the map tiles come from OpenFreeMap.
        Both services process your IP address to deliver the content.</p>
        <p>All stories and photos are published with the contributors' consent.
        Locations are rounded to town or district level.</p>
        <h3>Contact</h3>
        <p>Jakob Müller</p>
        <p><a href="mailto:jakob-mue@gmx.de">jakob-mue@gmx.de</a></p>
        <p class="small">Map: <a href="https://maplibre.org">MapLibre GL JS</a>,
        map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors,
        tiles: <a href="https://openfreemap.org">OpenFreeMap</a>.</p>
      `
    }
  };

  // start in the browser language, toggle via button (not saved anywhere)
  let lang = (navigator.language || "de").toLowerCase().startsWith("de") ? "de" : "en";
  const t = (key) => CONFIG.text[lang][key] || key;

  // small helper to build DOM nodes (textContent only -> no HTML injection from the data)
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null) continue;
      if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    }
    for (const child of children || []) {
      if (child) node.appendChild(child);
    }
    return node;
  }

  // only allow http(s) links
  function safeUrl(url) {
    try {
      const u = new URL(url, window.location.href);
      return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
    } catch (e) {
      return null;
    }
  }

  // "2024-07" -> "Juli 2024" / "July 2024"
  function formatMonth(value) {
    const m = /^(\d{4})(?:-(\d{2}))?/.exec(String(value || ""));
    if (!m) return value || "";
    if (!m[2]) return m[1];
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, 1));
    return new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", {
      month: "long", year: "numeric", timeZone: "UTC"
    }).format(d);
  }

  const typeInfo = (key) => CONFIG.eventTypes[key] || CONFIG.eventTypes.other;

  // use story_en / title_en in English if they exist, otherwise fall back to German
  function localized(props, field) {
    if (lang === "en" && props[field + "_en"]) return props[field + "_en"];
    return props[field] || "";
  }

  function showStatus(msg) {
    const s = document.getElementById("status");
    s.textContent = msg;
    s.hidden = !msg;
  }

  // --- map ---

  const map = new maplibregl.Map({
    container: "map",
    style: CONFIG.mapStyle,
    bounds: CONFIG.startBounds,
    fitBoundsOptions: { padding: 20 },
    minZoom: CONFIG.minZoom,
    renderWorldCopies: false,
    attributionControl: { compact: true }
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  map.on("style.load", () => {
    if (CONFIG.projection === "globe") map.setProjection({ type: "globe" });
  });

  let stories = [];
  let popup = null;

  function colorExpression() {
    const expr = ["match", ["get", "event_type"]];
    for (const [key, info] of Object.entries(CONFIG.eventTypes)) expr.push(key, info.color);
    expr.push(CONFIG.eventTypes.other.color);
    return expr;
  }

  function addLayers(geojson) {
    map.addSource("stories", {
      type: "geojson",
      data: geojson,
      cluster: true,
      clusterRadius: 40,
      clusterMaxZoom: 8
    });

    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "stories",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#1d1d1b",
        "circle-opacity": 0.85,
        "circle-radius": ["step", ["get", "point_count"], 14, 5, 18, 15, 24],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff"
      }
    });

    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "stories",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 13,
        "text-font": ["Noto Sans Bold"]
      },
      paint: { "text-color": "#fff" }
    });

    map.addLayer({
      id: "story-points",
      type: "circle",
      source: "stories",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": colorExpression(),
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 7, 10, 11],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff"
      }
    });

    map.on("click", "clusters", async (e) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
      const zoom = await map.getSource("stories").getClusterExpansionZoom(f.properties.cluster_id);
      map.easeTo({ center: f.geometry.coordinates, zoom });
    });

    // several stories can sit on the same spot, so grab everything near the click
    map.on("click", "story-points", (e) => {
      const p = e.point;
      const hits = map.queryRenderedFeatures(
        [[p.x - 6, p.y - 6], [p.x + 6, p.y + 6]],
        { layers: ["story-points"] }
      );
      const ids = [...new Set(hits.map((f) => f.properties._i))];
      openPopup(ids, 0, hits[0].geometry.coordinates);
    });

    for (const layer of ["clusters", "story-points"]) {
      map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
    }
  }

  // --- popup ---

  function storyNode(props, index, total, onNav) {
    const info = typeInfo(props.event_type);
    const children = [];

    const img = props.image ? safeUrl(props.image) : null;
    if (img) {
      children.push(el("img", {
        src: img,
        alt: localized(props, "image_alt") || t("photo"),
        loading: "lazy"
      }));
    }

    const body = el("div", { class: "body" }, [
      el("div", { class: "meta" }, [
        el("span", { class: "tag", style: "background:" + info.color, text: info[lang] }),
        el("span", { text: [props.place, formatMonth(props.month)].filter(Boolean).join(" · ") })
      ])
    ]);

    const title = localized(props, "title");
    if (title) body.appendChild(el("h2", { text: title }));
    const story = localized(props, "story");
    if (story) body.appendChild(el("p", { text: story }));
    if (props.image_credit) {
      body.appendChild(el("div", { class: "credit", text: t("photo") + ": " + props.image_credit }));
    }

    const articles = (props.articles || [])
      .map((a) => ({ ...a, href: safeUrl(a.url) }))
      .filter((a) => a.href);
    if (articles.length) {
      body.appendChild(el("h3", { text: t("articles") }));
      body.appendChild(el("ul", {}, articles.map((a) =>
        el("li", {}, [
          el("a", { href: a.href, target: "_blank", rel: "noopener noreferrer", text: a.title || a.href }),
          a.source ? document.createTextNode(" – " + a.source) : null
        ])
      )));
    }

    if (total > 1) {
      const prev = el("button", { type: "button", "aria-label": t("prev"), text: "‹" });
      const next = el("button", { type: "button", "aria-label": t("next"), text: "›" });
      prev.addEventListener("click", () => onNav(index - 1));
      next.addEventListener("click", () => onNav(index + 1));
      body.appendChild(el("div", { class: "meta pager" }, [
        prev,
        el("span", { text: (index + 1) + " " + t("of") + " " + total }),
        next
      ]));
    }

    children.push(body);
    return el("article", { class: "story" }, children);
  }

  function openPopup(ids, index, lngLat) {
    const total = ids.length;
    const i = ((index % total) + total) % total;
    const props = stories[ids[i]].properties;

    // move the map down a bit so the popup has room above the point
    const h = map.getContainer().clientHeight;
    map.easeTo({ center: lngLat, offset: [0, Math.round(h * 0.3)], duration: 400 });

    if (popup) popup.remove();
    popup = new maplibregl.Popup({ maxWidth: "none", offset: 12 })
      .setLngLat(lngLat)
      .setDOMContent(storyNode(props, i, total, (n) => openPopup(ids, n, lngLat)))
      .addTo(map);
  }

  // --- legend, language, about ---

  function renderLegend() {
    const counts = {};
    for (const f of stories) {
      const key = CONFIG.eventTypes[f.properties.event_type] ? f.properties.event_type : "other";
      counts[key] = (counts[key] || 0) + 1;
    }
    const legend = document.getElementById("legend");
    legend.replaceChildren();

    const used = Object.keys(CONFIG.eventTypes).filter((k) => counts[k]);
    if (!used.length) {
      legend.appendChild(el("span", { text: t("empty") }));
      return;
    }
    legend.appendChild(el("ul", {}, used.map((k) =>
      el("li", {}, [
        el("span", { class: "dot", style: "background:" + CONFIG.eventTypes[k].color }),
        el("span", { text: CONFIG.eventTypes[k][lang] }),
        el("span", { class: "count", text: String(counts[k]) })
      ])
    )));
  }

  function applyLanguage() {
    document.documentElement.lang = lang;
    document.title = t("title");
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.getAttribute("data-i18n"));
    });
    document.getElementById("btn-lang").textContent = t("switchTo");
    document.getElementById("info-content").innerHTML = CONFIG.about[lang];
    renderLegend();
    if (popup) popup.remove();
  }

  document.getElementById("btn-lang").addEventListener("click", () => {
    lang = lang === "de" ? "en" : "de";
    applyLanguage();
  });
  document.getElementById("btn-info").addEventListener("click", () => {
    document.getElementById("info").showModal();
  });

  // --- load data ---

  const dataPromise = fetch(CONFIG.dataUrl, { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then((geojson) => {
      stories = (geojson.features || []).filter((f) =>
        f && f.geometry && f.geometry.type === "Point" && f.properties
      );
      // index so the popup can find the original feature (maplibre flattens nested arrays)
      stories.forEach((f, i) => { f.properties._i = i; });
      return { type: "FeatureCollection", features: stories };
    })
    .catch((err) => {
      console.error(err);
      showStatus(t("loadError"));
      return { type: "FeatureCollection", features: [] };
    });

  applyLanguage();

  map.on("load", async () => {
    addLayers(await dataPromise);
    renderLegend();
  });
})();
