// This file dynamically generates a grid of YouTube video embeds and injects documentation
// into the DOM as the process continues. Formatting and process feedback is provided in the
// #docInfo area.

function addDocInfo(html) {
  let docInfo = document.getElementById("docInfo");
  if (!docInfo) {
    docInfo = document.createElement("div");
    docInfo.id = "docInfo";
    docInfo.style.background = "#f6f6f6";
    docInfo.style.fontSize = "13px";
    docInfo.style.color = "#222";
    docInfo.style.border = "1px dashed #bbb";
    docInfo.style.padding = "8px";
    docInfo.style.margin = "8px 0";
    docInfo.style.borderRadius = "6px";
    docInfo.style.lineHeight = "1.5";
    docInfo.innerHTML = "<h4 style='margin:4px 0 8px;'>Grid Info &amp; Formatting</h4>";
    const container = document.getElementById("gridContainer");
    if (container) container.parentNode.insertBefore(docInfo, container);
    else document.body.insertBefore(docInfo, document.body.firstChild);
  }
  docInfo.innerHTML += html;
}

function getVideoIdsFromQuery() {
  // This function extracts a list of video IDs from the ?videos= parameter
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("videos");
  if (!raw) {
    addDocInfo("<div style='color:#b00;'>No video IDs found in the <code>?videos=</code> url parameter.</div>");
    return [];
  }

  try {
    const arr = JSON.parse(decodeURIComponent(raw));
    if (Array.isArray(arr)) {
      addDocInfo(`<div>✅ URL request for videos completed, <b>${arr.length}</b> video(s) parsed.</div>`);
      return arr.filter((x) => typeof x === "string" && x.trim().length > 0);
    }
  } catch (e) {
    console.error("Failed to parse video list:", e);
    addDocInfo("<div style='color:#b00;'>❌ Failed to parse <code>?videos=</code> list from url.</div>");
  }

  return [];
}

function createEmbedUrl(id) {
  // This function creates a minimal YouTube embed URL, with muting and no related videos.
  // The player hides controls, disables keyboard, disables fullscreen, and requests autoplay.
  // <b>iframe width defaults to 100% of its grid cell; height is responsive (see CSS).</b>
  const qp = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3",
    playsinline: "1",
    fs: "0",
    disablekb: "1",
    showinfo: "0"
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${qp.toString()}`;
}

const youtubeEmbedUrlPrefixes = [
  "https://www.youtube.com/embed",
  "https://youtube.com/embed",
  "https://www.youtube-nocookie.com/embed",
  "https://youtube-nocookie.com/embed"
];

function tryFixIFrame(iframe) {
  // Patch iframes to enforce stricter privacy/referrerpolicy and use youtube-nocookie domain.
  if (!(iframe instanceof HTMLIFrameElement)) return;
  if (iframe.dataset?.yt153Fixed === "1") return;

  const src = typeof iframe.src === "string" ? iframe.src : "";
  const isYoutubeIFrame = youtubeEmbedUrlPrefixes.some((x) => src.startsWith(x));
  if (!isYoutubeIFrame) return;

  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  iframe.referrerPolicy = "strict-origin-when-cross-origin";

  if (src.includes("youtube.com") && !src.includes("youtube-nocookie.com")) {
    iframe.src = src.replace("youtube.com", "youtube-nocookie.com");
    addDocInfo("<div>🔒 Switched iframe embed to <code>youtube-nocookie.com</code> for privacy.</div>");
  }

  iframe.dataset.yt153Fixed = "1";
}

document.addEventListener("DOMContentLoaded", () => {
  // Adds a docInfo box to explain grid/iframe formatting up front.
  addDocInfo(`
    <div>
      <b>Grid container:</b> Videos are shown in a grid layout.<br>
      <b>iframe width:</b> 100% of cell (<code>div.video-frame</code>), height is controlled with CSS for good aspect-ratio.<br>
      <b>Embed privacy:</b> All iframes use <code>youtube-nocookie.com</code> by default.<br>
    </div>
  `);

  const container = document.getElementById("gridContainer");
  const ids = getVideoIdsFromQuery();

  if (!ids.length) {
    container.className = "empty-state";
    container.textContent = "No videos provided.";
    addDocInfo("<div style='color:#b00;'>No videos to display — make sure the <code>?videos=...</code> url parameter is present and valid.</div>");
    return;
  }

  addDocInfo(`<div>🎬 Preparing to render <b>${ids.length}</b> video(s) in grid.</div>`);

  for (const id of ids) {
    const wrapper = document.createElement("div");
    wrapper.className = "video-frame";

    const iframe = document.createElement("iframe");
    iframe.src = createEmbedUrl(id);
    tryFixIFrame(iframe);
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    // Optional: Document per-iframe
    addDocInfo(`<div>• Added iframe for ID <code>${id}</code> (<b>width: 100%</b> of cell, <b>aspect: 16:9</b>).`);
    wrapper.appendChild(iframe);
    container.appendChild(wrapper);
  }

  for (const iframe of document.querySelectorAll("iframe")) {
    tryFixIFrame(iframe);
  }

  // Set up a mutation observer to document additions of new iframes, if it ever happens.
  const iframes = new MutationObserver(() => {
    let count = 0;
    for (const iframe of document.querySelectorAll("iframe")) {
      if (!iframe.dataset.yt153Fixed) {
        tryFixIFrame(iframe);
        count++;
      }
    }
    if (count > 0) {
      addDocInfo(`<div>ℹ️ ${count} new iframe(s) detected and fixed for privacy.</div>`);
    }
  });

  iframes.observe(document, { subtree: true, childList: true });

  addDocInfo(`<div style="margin-top:6px;color:#008800;">✅ All videos loaded in grid. Please see above for formatting info.</div>`);
});
