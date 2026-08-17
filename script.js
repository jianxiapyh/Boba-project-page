const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navLinks?.classList.toggle("is-open", !isOpen);
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navToggle?.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("is-open");
  });
});

const copyButton = document.querySelector("[data-copy-button]");
const copyLabel = document.querySelector("[data-copy-label]");
const bibtex = document.querySelector("#bibtex");

copyButton?.addEventListener("click", async () => {
  const text = bibtex?.textContent?.trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  copyLabel.textContent = "Copied";
  window.setTimeout(() => {
    copyLabel.textContent = "Copy";
  }, 1800);
});

const sectionLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      sectionLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${visible.target.id}`;
        if (isCurrent) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-28% 0px -58%", threshold: [0, 0.2, 0.5] },
  );

  sections.forEach((section) => observer.observe(section));
}

const autoDemoVideos = [...document.querySelectorAll("video[data-auto-demo]")];
const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

if (autoDemoVideos.length && !prefersReducedMotion && "IntersectionObserver" in window) {
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.play().catch(() => {});
        else entry.target.pause();
      });
    },
    { rootMargin: "120px 0px", threshold: 0.25 },
  );

  autoDemoVideos.forEach((video) => videoObserver.observe(video));
}

const lightbox = document.querySelector("[data-image-lightbox]");
const lightboxStage = document.querySelector("[data-lightbox-stage]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxTitle = document.querySelector("#lightbox-title");
let activeZoomTrigger = null;
let pausedForLightbox = null;

const closeLightbox = () => {
  lightboxStage?.querySelectorAll("video").forEach((video) => video.pause());
  if (lightbox?.open) lightbox.close();
};

const openLightbox = (sourceImage) => {
  const source = sourceImage.currentSrc || sourceImage.src;

  if (!lightbox || !lightboxStage || typeof lightbox.showModal !== "function") {
    window.open(source, "_blank", "noopener");
    return;
  }

  activeZoomTrigger = sourceImage;
  if (lightboxTitle) lightboxTitle.textContent = "Figure preview";

  const preview = document.createElement("img");
  preview.src = source;
  preview.alt = sourceImage.alt;

  const captionCopy = sourceImage.closest("figure")?.querySelector("figcaption")?.cloneNode(true);
  captionCopy?.querySelector(".figure-action")?.remove();

  lightboxStage.replaceChildren(preview);
  lightboxCaption.textContent =
    captionCopy?.textContent?.replace(/\s+/g, " ").trim() || sourceImage.alt;
  document.body.classList.add("lightbox-open");
  lightbox.showModal();
};

const fidelityPlayer = document.querySelector("[data-fidelity-player]");
const fidelityCase = fidelityPlayer?.querySelector("[data-fidelity-case]");
const fidelityVideo = fidelityPlayer?.querySelector("[data-fidelity-video]");
const fidelitySource = fidelityPlayer?.querySelector("[data-fidelity-source]");
const fidelityFallback = fidelityPlayer?.querySelector("[data-fidelity-fallback]");
const fidelityCaseIndex = fidelityPlayer?.querySelector("[data-fidelity-case-index]");
const fidelityCurrentCase = fidelityPlayer?.querySelector("[data-fidelity-current-case]");
const fidelityExpand = fidelityPlayer?.querySelector("[data-fidelity-expand]");
const fidelityOptions = fidelityCase ? [...fidelityCase.options] : [];

const selectFidelityCase = ({ loadVideo = true } = {}) => {
  const option = fidelityCase?.selectedOptions[0];
  if (!option || !fidelityVideo || !fidelitySource) return;

  const caseName = option.value;
  const caseLabel = option.textContent.trim();
  const videoPath = `assets/fidelity/${caseName}.mp4`;
  const posterPath = `assets/fidelity/posters/${caseName}.jpg`;
  const optionIndex = fidelityOptions.indexOf(option) + 1;

  if (fidelityCaseIndex) fidelityCaseIndex.textContent = String(optionIndex);
  if (fidelityCurrentCase) fidelityCurrentCase.textContent = caseLabel;
  if (fidelityFallback) fidelityFallback.href = videoPath;
  if (fidelityExpand) fidelityExpand.setAttribute("aria-label", `Open larger comparison for ${caseLabel}`);
  fidelityVideo.poster = posterPath;
  fidelityVideo.setAttribute(
    "aria-label",
    `${caseLabel} comparison: Observation, PhysTwin, and Boba`,
  );

  if (!loadVideo) return;

  fidelitySource.src = videoPath;
  fidelityVideo.load();
  if (!prefersReducedMotion) fidelityVideo.play().catch(() => {});
};

const openFidelityPreview = () => {
  if (!fidelityVideo || !fidelitySource) return;

  const source = fidelitySource.src;
  const caseLabel = fidelityCurrentCase?.textContent?.trim() || "Selected benchmark case";

  if (!lightbox || !lightboxStage || typeof lightbox.showModal !== "function") {
    if (typeof fidelityVideo.requestFullscreen === "function") fidelityVideo.requestFullscreen();
    else window.open(source, "_blank", "noopener");
    return;
  }

  activeZoomTrigger = fidelityExpand;
  pausedForLightbox = fidelityVideo.paused ? null : fidelityVideo;
  fidelityVideo.pause();
  if (lightboxTitle) lightboxTitle.textContent = `Qualitative comparison · ${caseLabel}`;

  const comparison = document.createElement("div");
  comparison.className = "fidelity-modal-comparison";
  const labels = fidelityPlayer?.querySelector(".fidelity-comparison-labels")?.cloneNode(true);
  if (labels) comparison.appendChild(labels);

  const preview = document.createElement("video");
  preview.src = source;
  preview.poster = fidelityVideo.poster;
  preview.controls = true;
  preview.muted = true;
  preview.loop = true;
  preview.playsInline = true;
  preview.preload = "auto";
  preview.setAttribute("aria-label", fidelityVideo.getAttribute("aria-label") || caseLabel);
  const resumeTime = fidelityVideo.currentTime;
  preview.addEventListener(
    "loadedmetadata",
    () => {
      preview.currentTime = Math.min(resumeTime, Math.max(0, preview.duration - 0.05));
      if (!prefersReducedMotion) preview.play().catch(() => {});
    },
    { once: true },
  );
  comparison.appendChild(preview);

  lightboxStage.replaceChildren(comparison);
  lightboxCaption.textContent = `${caseLabel}: synchronized Observation, PhysTwin, and Boba playback.`;
  document.body.classList.add("lightbox-open");
  lightbox.showModal();
};

fidelityCase?.addEventListener("change", () => selectFidelityCase());
fidelityExpand?.addEventListener("click", openFidelityPreview);
selectFidelityCase({ loadVideo: false });

document.querySelectorAll("img[data-zoomable]").forEach((image) => {
  image.tabIndex = 0;
  image.setAttribute("role", "button");
  image.setAttribute("aria-haspopup", "dialog");
  image.setAttribute("aria-controls", "figure-lightbox");
  image.setAttribute("aria-label", `View larger: ${image.alt}`);

  image.addEventListener("click", () => openLightbox(image));
  image.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openLightbox(image);
  });
});

lightboxClose?.addEventListener("click", closeLightbox);

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

lightbox?.addEventListener("close", () => {
  document.body.classList.remove("lightbox-open");
  lightboxStage?.querySelectorAll("video").forEach((video) => video.pause());
  lightboxStage?.replaceChildren();
  activeZoomTrigger?.focus();
  activeZoomTrigger = null;
  if (pausedForLightbox && !prefersReducedMotion) pausedForLightbox.play().catch(() => {});
  pausedForLightbox = null;
});
