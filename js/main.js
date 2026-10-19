const projectTabs = document.querySelector("#project-tabs");
const projectDetail = document.querySelector("#project-detail");
const galleryModal = document.querySelector("#screenshot-gallery");
const galleryTitle = document.querySelector("#gallery-title");
const galleryImage = document.querySelector("#gallery-image");
const galleryCaption = document.querySelector("#gallery-caption");
const galleryCounter = document.querySelector("#gallery-counter");
const galleryThumbs = document.querySelector("#gallery-thumbs");
const galleryPrev = document.querySelector(".gallery-prev");
const galleryNext = document.querySelector(".gallery-next");
let galleryProject = null;
let galleryFiles = [];
let galleryIndex = 0;
const galleryClose = document.querySelector(".gallery-close");
let selectedProjectIndex = 0;
let galleryTrigger = null;
let previousBodyOverflow = "";

function screenshotTitle(fileName) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
}

function screenshotUrl(project, fileName) {
  return encodeURI(`assets/screenshots/${project.id}/${fileName}`);
}

function projectScreenshots(project) {
  const scanned = typeof screenshotManifest !== "undefined" ? screenshotManifest[project.id] : null;
  return scanned && scanned.length ? scanned : project.screenshots;
}

function showGalleryImage(index) {
  if (!galleryFiles.length) return;
  galleryIndex = (index + galleryFiles.length) % galleryFiles.length;
  const fileName = galleryFiles[galleryIndex];
  const title = screenshotTitle(fileName);
  galleryImage.src = screenshotUrl(galleryProject, fileName);
  galleryImage.alt = title;
  galleryCaption.textContent = title;
  galleryCounter.textContent = `${galleryIndex + 1} / ${galleryFiles.length}`;
  galleryThumbs.querySelectorAll(".gallery-thumb").forEach((thumb, i) => {
    const active = i === galleryIndex;
    thumb.classList.toggle("is-active", active);
    thumb.setAttribute("aria-current", String(active));
    if (active) thumb.scrollIntoView({ block: "nearest", inline: "center" });
  });
}

function openScreenshotGallery(project, trigger) {
  if (!galleryModal || !galleryTitle || !galleryImage) return;
  galleryTrigger = trigger;
  galleryProject = project;
  galleryFiles = projectScreenshots(project);
  galleryTitle.textContent = `${project.name} — Screenshots`;
  galleryModal.classList.toggle("is-mobile-gallery", project.category === "Mobile");
  const single = galleryFiles.length < 2;
  [galleryPrev, galleryNext, galleryThumbs].forEach((el) => { el.hidden = single; });
  galleryThumbs.replaceChildren();
  galleryFiles.forEach((fileName, i) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "gallery-thumb";
    thumb.setAttribute("aria-label", `Show screenshot ${i + 1}: ${screenshotTitle(fileName)}`);
    const image = document.createElement("img");
    image.src = screenshotUrl(project, fileName);
    image.alt = "";
    image.loading = "lazy";
    thumb.append(image);
    thumb.addEventListener("click", () => showGalleryImage(i));
    galleryThumbs.append(thumb);
  });
  showGalleryImage(0);
  galleryModal.hidden = false;
  galleryModal.setAttribute("aria-hidden", "false");
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  galleryClose?.focus();
}

galleryPrev?.addEventListener("click", () => showGalleryImage(galleryIndex - 1));
galleryNext?.addEventListener("click", () => showGalleryImage(galleryIndex + 1));

let swipeStartX = null;
galleryImage?.addEventListener("pointerdown", (event) => { swipeStartX = event.clientX; });
galleryImage?.addEventListener("pointerup", (event) => {
  if (swipeStartX === null) return;
  const delta = event.clientX - swipeStartX;
  swipeStartX = null;
  if (Math.abs(delta) > 50) showGalleryImage(galleryIndex + (delta < 0 ? 1 : -1));
});

function closeScreenshotGallery() {
  if (!galleryModal || galleryModal.hidden) return;
  galleryModal.hidden = true;
  galleryModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = previousBodyOverflow;
  galleryTrigger?.focus();
  galleryTrigger = null;
}

function renderProjectTabs() {
  if (!projectTabs || !Array.isArray(projects)) return;

  projectTabs.innerHTML = projects.map((project, index) => `
    <button class="project-tab${index === selectedProjectIndex ? " is-selected" : ""}" id="project-tab-${index}" type="button" role="tab" aria-selected="${index === selectedProjectIndex}" aria-controls="project-detail" tabindex="${index === selectedProjectIndex ? "0" : "-1"}" title="${project.name}" data-project-index="${index}">
      <span class="project-tab-number">${String(index + 1).padStart(2, "0")}</span><span class="project-tab-name">${project.shortName}</span>
    </button>`).join("");

  projectTabs.querySelectorAll(".project-tab").forEach((tab) => {
    tab.addEventListener("click", () => selectProject(Number(tab.dataset.projectIndex)));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const currentIndex = Number(tab.dataset.projectIndex);
      const nextIndex = event.key === "Home" ? 0
        : event.key === "End" ? projects.length - 1
          : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + projects.length) % projects.length;
      selectProject(nextIndex);
      projectTabs.querySelector(`[data-project-index="${nextIndex}"]`)?.focus();
    });
  });
}

function renderProjectDetail(project, index) {
  if (!projectDetail) return;
  const resourceLinks = [
    `<a class="project-resource-link" href="${project.link}" target="_blank" rel="noopener noreferrer">View GitHub repository <span>↗</span></a>`,
    project.demo ? `<a class="project-resource-link" href="${project.demo}" target="_blank" rel="noopener noreferrer">Watch demo <span>↗</span></a>` : "",
    project.apk ? `<a class="project-resource-link" href="${project.apk}" target="_blank" rel="noopener noreferrer">Download APK <span>↗</span></a>` : "",
    project.relatedLink ? `<a class="project-resource-link" href="${project.relatedLink}" target="_blank" rel="noopener noreferrer">Related database repository <span>↗</span></a>` : ""
  ].filter(Boolean).join("");

  projectDetail.style.setProperty("--project-tone", `var(--tone-${project.tone})`);
  projectDetail.classList.toggle("is-mobile", project.category === "Mobile");
  projectDetail.setAttribute("aria-labelledby", `project-tab-${index}`);
  const shots = projectScreenshots(project);
  const coverName = shots.find((name) => /^homepage\./i.test(name)) || shots[0];
  const galleryButton = `<button class="view-screenshots button button-glass" type="button">Click to expand screenshots (${shots.length}) <span aria-hidden="true">›</span></button>`;
  projectDetail.innerHTML = `
    <div class="project-detail-head">
      <div><p class="project-overline">${String(index + 1).padStart(2, "0")} / ${project.category.toUpperCase()} PROJECT</p><h3>${project.name}</h3><p class="project-lead">${project.description}</p></div>
      <span class="project-status">${project.status}</span>
    </div>
    <div class="project-detail-grid">
      <div class="project-detail-main">
        <section class="detail-block"><h4>WHAT IT DOES</h4><p>${project.description}</p></section>
        <section class="detail-block"><h4>IMPLEMENTED FEATURES</h4><ul class="feature-list">${project.features.map((feature) => `<li>${feature}</li>`).join("")}</ul></section>
        <section class="detail-block"><h4>TECHNOLOGY</h4><div class="tech-tags">${project.stack.split(" · ").map((item) => `<span>${item}</span>`).join("")}</div></section>
        <section class="detail-block"><h4>DATA / STORAGE</h4><p>${project.database}</p></section>
        <section class="detail-block"><h4>MY ROLE</h4><p>${project.role}</p></section>
        <div class="project-resource-links">${resourceLinks}</div>
      </div>
      <aside class="screenshot-slot" aria-label="Screenshot of ${project.name}">
        <div class="screenshot-cover" data-screenshot-shape="${project.category === "Mobile" ? "portrait" : "landscape"}">
          <img class="screenshot-cover-image" loading="lazy">
          <div class="screenshot-placeholder" hidden><span class="screenshot-icon" aria-hidden="true">▧</span><strong>PROJECT PREVIEW</strong><p>Project screenshot will appear here.</p></div>
        </div>
        ${galleryButton}
      </aside>
    </div>`;

  const cover = projectDetail.querySelector(".screenshot-cover-image");
  const placeholder = projectDetail.querySelector(".screenshot-placeholder");
  cover.alt = `${project.name} — ${screenshotTitle(coverName)}`;
  cover.addEventListener("error", () => {
    cover.hidden = true;
    placeholder.hidden = false;
  }, { once: true });
  cover.addEventListener("load", () => {
    cover.hidden = false;
    placeholder.hidden = true;
  }, { once: true });
  cover.src = screenshotUrl(project, coverName);
  projectDetail.querySelector(".view-screenshots")?.addEventListener("click", (event) => {
    openScreenshotGallery(project, event.currentTarget);
  });
}

function selectProject(index) {
  if (!Number.isInteger(index) || index < 0 || index >= projects.length) return;
  selectedProjectIndex = index;
  projectTabs?.querySelectorAll(".project-tab").forEach((tab, tabIndex) => {
    const selected = tabIndex === index;
    tab.classList.toggle("is-selected", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.setAttribute("tabindex", selected ? "0" : "-1");
  });
  renderProjectDetail(projects[index], index);
}

renderProjectTabs();
selectProject(selectedProjectIndex);

galleryModal?.addEventListener("click", (event) => {
  if (event.target === galleryModal) closeScreenshotGallery();
});

galleryClose?.addEventListener("click", closeScreenshotGallery);

document.addEventListener("keydown", (event) => {
  if (!galleryModal || galleryModal.hidden) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeScreenshotGallery();
    return;
  }
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    showGalleryImage(galleryIndex + (event.key === "ArrowRight" ? 1 : -1));
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...galleryModal.querySelectorAll("button:not(:disabled)")].filter((button) => !button.closest("[hidden]") && !button.hidden);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector("#site-menu");

menuToggle?.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  menuToggle.setAttribute("aria-label", expanded ? "Open navigation menu" : "Close navigation menu");
  siteMenu?.classList.toggle("is-open", !expanded);
});

siteMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    siteMenu.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open navigation menu");
  });
});

const navigationLinks = [...document.querySelectorAll(".nav-links a")];
const sections = navigationLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navigationLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-38% 0px -52% 0px" });
  sections.forEach((section) => sectionObserver.observe(section));

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));
} else {
  document.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
}

document.querySelector("#current-year").textContent = String(new Date().getFullYear());

document.querySelector("#email-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const emailInput = document.querySelector("#email-input");
  if (!(emailInput instanceof HTMLInputElement) || !emailInput.reportValidity()) return;
  const subject = encodeURIComponent("Internship opportunity / portfolio contact");
  const body = encodeURIComponent(`Hi Dhanu,\n\nI'd like to get in touch.\n\nMy email: ${emailInput.value.trim()}`);
  window.location.href = `mailto:guruprashathprashath2004@gmail.com?subject=${subject}&body=${body}`;
});