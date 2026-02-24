function getVideoIdsFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("videos");
  if (!raw) return [];

  try {
    const arr = JSON.parse(decodeURIComponent(raw));
    if (Array.isArray(arr)) return arr.filter((x) => typeof x === "string" && x.trim().length > 0);
  } catch (e) {
    console.error("Failed to parse video list:", e);
  }

  return [];
}

function createEmbedUrl(id) {
  // "Minimal chrome" parameters; autoplay typically requires mute=1.
  const qp = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3"
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
  if (!(iframe instanceof HTMLIFrameElement)) return;
  if (iframe.dataset?.yt153Fixed === "1") return;

  const src = typeof iframe.src === "string" ? iframe.src : "";
  const isYoutubeIFrame = youtubeEmbedUrlPrefixes.some((x) => src.startsWith(x));
  if (!isYoutubeIFrame) return;

  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  iframe.referrerPolicy = "strict-origin-when-cross-origin";

  if (src.includes("youtube.com") && !src.includes("youtube-nocookie.com")) {
    iframe.src = src.replace("youtube.com", "youtube-nocookie.com");
  }

  iframe.dataset.yt153Fixed = "1";
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("gridContainer");
  const ids = getVideoIdsFromQuery();

  if (!ids.length) {
    container.className = "empty-state";
    container.textContent = "No videos provided.";
    return;
  }

  for (const id of ids) {
    const wrapper = document.createElement("div");
    wrapper.className = "video-frame";

    const iframe = document.createElement("iframe");
    iframe.src = createEmbedUrl(id);
    tryFixIFrame(iframe);
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    wrapper.appendChild(iframe);
    container.appendChild(wrapper);
  }

  for (const iframe of document.querySelectorAll("iframe")) {
    tryFixIFrame(iframe);
  }

  const iframes = new MutationObserver(() => {
    for (const iframe of document.querySelectorAll("iframe")) {
      tryFixIFrame(iframe);
    }
  });

  iframes.observe(document, { subtree: true, childList: true });
});

