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
let activeZoomTrigger = null;

const closeLightbox = () => {
  if (lightbox?.open) lightbox.close();
};

const openLightbox = (sourceImage) => {
  const source = sourceImage.currentSrc || sourceImage.src;

  if (!lightbox || !lightboxStage || typeof lightbox.showModal !== "function") {
    window.open(source, "_blank", "noopener");
    return;
  }

  activeZoomTrigger = sourceImage;

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
  lightboxStage?.replaceChildren();
  activeZoomTrigger?.focus();
  activeZoomTrigger = null;
});
