const $ = (sel, root = document) => root.querySelector(sel);

function getApiBase() {
  const meta = document.querySelector('meta[name="api-base"]');
  const fromMeta = meta?.getAttribute("content")?.trim();
  if (fromMeta) return fromMeta.replace(/\/$/, "");

  const { protocol, hostname, port } = window.location;
  const host = hostname || "";

  if (protocol === "file:") return "http://127.0.0.1:1000";

  const isLocalhost =
    host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
  const isPrivateLan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);

  const devPorts = new Set(["5173", "4173", "5500", "8080", "3000", "3030"]);
  if (devPorts.has(port)) {
    if (isLocalhost) return "http://127.0.0.1:1000";
    if (isPrivateLan) return `${protocol}//${host}:1000`;
  }

  if (isLocalhost) return "http://127.0.0.1:000";

  return "";
}

const API_BASE = getApiBase();

function setAlert(el, type, message) {
  el.hidden = false;
  el.className = `alert ${type ? `alert--${type}` : ""}`.trim();
  el.textContent = message;
}

function clearAlert(el) {
  el.hidden = true;
  el.textContent = "";
  el.className = "alert";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function normalizePhone(phone) {
  return String(phone).trim().replace(/\s+/g, " ");
}

function parseDateTimeLocal(value) {
  // datetime-local gives "YYYY-MM-DDTHH:mm" without TZ. Interpret as local and send ISO.
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function setFieldInvalid(field, invalid) {
  field.setAttribute("aria-invalid", invalid ? "true" : "false");
}

function setupNavbar() {
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  if (!toggle || !links) return;

  const close = () => {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  };
  const open = () => {
    links.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  };

  toggle.addEventListener("click", () => {
    if (links.classList.contains("is-open")) close();
    else open();
  });

  links.addEventListener("click", (e) => {
    if (e.target && e.target.tagName === "A") close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  document.addEventListener("click", (e) => {
    if (!links.classList.contains("is-open")) return;
    if (links.contains(e.target) || toggle.contains(e.target)) return;
    close();
  });
}

function setupRevealAnimations() {
  const nodes = [...document.querySelectorAll(".reveal")];
  if (!nodes.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    },
    { threshold: 0.12 }
  );

  nodes.forEach((n) => io.observe(n));
}

function setupYear() {
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function setupReviewsCarousel() {
  const carousel = $("#reviewsCarousel");
  if (!carousel) return;

  const track = $("#reviewsTrack");
  if (!track) return;

  const slides = [...track.querySelectorAll(".reviews-carousel__slide")];
  if (!slides.length) return;

  const prevBtn = $("#reviewsPrev");
  const nextBtn = $("#reviewsNext");
  const dotsEl = $("#reviewsDots");

  const reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  let index = 0;
  let timerId = null;

  const setIndex = (nextIndex, { immediate = false } = {}) => {
    index = ((nextIndex % slides.length) + slides.length) % slides.length;
    track.style.transitionDuration = immediate ? "0ms" : "";
    track.style.transform = `translateX(-${index * 100}%)`;

    if (dotsEl) {
      const dots = [...dotsEl.querySelectorAll(".reviews-carousel__dot")];
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    }
  };

  const buildDots = () => {
    if (!dotsEl) return;
    dotsEl.innerHTML = "";
    for (let i = 0; i < slides.length; i += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "reviews-carousel__dot";
      dot.setAttribute("aria-label", `Go to review ${i + 1}`);
      dot.addEventListener("click", () => setIndex(i));
      dotsEl.appendChild(dot);
    }
    const dots = [...dotsEl.querySelectorAll(".reviews-carousel__dot")];
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
  };

  const start = () => {
    if (reduceMotion || slides.length < 2) return;
    stop();
    timerId = window.setInterval(() => setIndex(index + 1), 3800);
  };

  const stop = () => {
    if (timerId) window.clearInterval(timerId);
    timerId = null;
  };

  if (dotsEl) buildDots();
  setIndex(0, { immediate: true });
  start();

  if (prevBtn) prevBtn.addEventListener("click", () => setIndex(index - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => setIndex(index + 1));

  const pause = () => stop();
  const resume = () => start();

  carousel.addEventListener("mouseenter", pause);
  carousel.addEventListener("mouseleave", resume);
  carousel.addEventListener("focusin", pause);
  carousel.addEventListener("focusout", resume);
  carousel.addEventListener("touchstart", pause, { passive: true });
  carousel.addEventListener("touchend", resume);
}

function renderStars(rating) {
  const r = Number(rating);
  const safe = Number.isFinite(r) ? r : 0;
  const spans = [];
  for (let i = 1; i <= 5; i += 1) {
    spans.push(`<span class="star ${i <= safe ? "is-on" : ""}">★</span>`);
  }
  return spans.join("");
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[c] || c;
  });
}

function makeReviewCardFromFeedback(fb) {
  const name = fb?.name ? String(fb.name).trim() : "Customer";
  const initial = name.slice(0, 2).toUpperCase();
  const rating = fb?.rating ?? 5;
  const service = fb?.service ? String(fb.service).trim() : "";
  const message = fb?.message ? String(fb.message).trim() : "";

  const meta = [service ? `Service • ${service}` : "", "Verified feedback"]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return `
    <article class="review-card reviews-carousel__slide" aria-label="Customer feedback review">
      <div class="review-card__top">
        <div class="avatar" aria-hidden="true">${escapeHtml(initial)}</div>
        <div>
          <h3 class="review-card__name">${escapeHtml(name)}</h3>
          <div class="review-card__meta">${escapeHtml(meta)}</div>
        </div>
        <div class="stars" aria-label="${escapeHtml(rating)} out of 5 stars">
          ${renderStars(rating)}
        </div>
      </div>
      <p class="review-card__text">${escapeHtml(message)}</p>
    </article>
  `;
}

async function populateFeedbackReviews() {
  // Adds MongoDB feedback into the existing reviews carousel.
  // If the API call fails, static reviews remain visible.
  try {
    const track = $("#reviewsTrack");
    if (!track) return;

    const r = await fetch(`${API_BASE}/api/feedback?limit=20`);
    if (!r.ok) return;
    const data = await r.json().catch(() => null);
    const feedbacks = data?.feedback;
    if (!Array.isArray(feedbacks) || feedbacks.length === 0) return;

    const batch = feedbacks.slice(0, 10);
    for (let i = batch.length - 1; i >= 0; i -= 1) {
      const temp = document.createElement("div");
      temp.innerHTML = makeReviewCardFromFeedback(batch[i]);
      const slide = temp.firstElementChild;
      if (slide) track.insertBefore(slide, track.firstElementChild);
    }
  } catch {
    // ignore
  }
}

function setupFeedbackModal() {
  const modal = $("#feedbackModal");
  const openBtn = $("#openFeedbackModal");
  const backdrop = $("#feedbackModalBackdrop");
  const closeBtn = $("#feedbackModalClose");
  if (!modal || !openBtn) return;

  let lastFocus = null;

  const isOpen = () => modal.getAttribute("aria-hidden") === "false";

  const open = () => {
    lastFocus = document.activeElement;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const firstField = modal.querySelector('input[name="name"]');
    window.requestAnimationFrame(() => {
      (firstField || closeBtn)?.focus?.();
    });
  };

  const close = () => {
    if (!isOpen()) return;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocus?.focus?.();
    lastFocus = null;
  };

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      e.preventDefault();
      close();
    }
  });
}

function setupFeedbackForm() {
  const form = $("#feedbackForm");
  const alertEl = $("#feedbackAlert");
  const submitBtn = $("#feedbackSubmitBtn");
  if (!form || !alertEl || !submitBtn) return;

  const fields = {
    name: form.elements.namedItem("name"),
    phone: form.elements.namedItem("phone"),
    email: form.elements.namedItem("email"),
    service: form.elements.namedItem("service"),
    rating: form.elements.namedItem("rating"),
    message: form.elements.namedItem("message")
  };

  const getValues = () => ({
    name: String(fields.name.value || "").trim(),
    phone: normalizePhone(fields.phone.value || ""),
    email: String(fields.email.value || "").trim(),
    service: String(fields.service.value || "").trim(),
    rating: String(fields.rating.value || "").trim(),
    message: String(fields.message.value || "").trim()
  });

  const setInvalids = (invalid) => {
    for (const f of Object.values(fields)) if (f) setFieldInvalid(f, invalid);
  };

  const validate = () => {
    const v = getValues();
    const errors = [];

    const ratingNum = Number(v.rating);
    if (!v.name) errors.push({ field: fields.name, msg: "Please enter your name." });
    if (!v.phone) errors.push({ field: fields.phone, msg: "Please enter your phone number." });
    if (v.email && !isValidEmail(v.email))
      errors.push({ field: fields.email, msg: "Please enter a valid email address." });
    if (!v.service) errors.push({ field: fields.service, msg: "Please select a service type." });
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5)
      errors.push({ field: fields.rating, msg: "Please select a valid rating." });
    if (!v.message || v.message.length < 10)
      errors.push({ field: fields.message, msg: "Please add more details (at least 10 characters)." });

    setInvalids(false);
    if (errors.length) {
      for (const e of errors) if (e.field) setFieldInvalid(e.field, true);
      const first = errors[0].field;
      if (first && typeof first.focus === "function") first.focus();
      setAlert(alertEl, "error", errors[0].msg);
      return null;
    }

    clearAlert(alertEl);
    return {
      name: v.name,
      phone: v.phone,
      email: v.email,
      service: v.service,
      rating: ratingNum,
      message: v.message
    };
  };

  const setLoading = (loading) => {
    submitBtn.disabled = loading;
    submitBtn.classList.toggle("is-loading", loading);
  };

  form.addEventListener("input", () => {
    if (!alertEl.hidden) clearAlert(alertEl);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const valid = validate();
    if (!valid) return;

    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valid)
      });

      const data = await r.json().catch(() => null);
      if (!r.ok) {
        setAlert(alertEl, "error", data?.error || "Feedback submission failed. Please try again.");
        return;
      }

      form.reset();
      setAlert(alertEl, "success", "Thanks! Your feedback has been added to our reviews.");
      window.setTimeout(() => window.location.reload(), 900);
    } catch {
      const hint =
        !API_BASE && window.location.protocol !== "file:"
          ? " Add a meta tag api-base pointing at your API, or use localhost for development."
          : "";
      setAlert(
        alertEl,
        "error",
        `Could not reach the server (${API_BASE || "same origin"}/api). Is the backend running on port 5000?${hint}`
      );
    } finally {
      setLoading(false);
    }
  });
}

const BOOKING_SERVICE_SUBS = {
  Surveillance: ["IP/Analog cameras", "DVR/NVR setup", "Remote viewing"],
  "Structured Cabling": ["CAT6/CAT6A runs", "Patch panels & racks", "Testing & labeling"],
  Networking: ["Router/switch setup", "VLAN & segmentation", "LAN/WAN troubleshooting"],
  Firewalls: ["Policy setup", "VPN configuration", "Content filtering"],
  "Wireless Access Points": ["Site placement", "SSID/guest Wi-Fi", "Roaming optimization"],
  "Computer Peripherals & Software": ["Printers & scanners", "UPS & storage", "OS/app setup"],
  "VoIP and Video Conferencing": ["VoIP phones", "Meeting room setup", "Audio/video tuning"]
};

function setupBookingForm() {
  const form = $("#bookingForm");
  const alertEl = $("#formAlert");
  const submitBtn = $("#submitBtn");
  const serviceSelect = $("#bookingService");
  const subWrap = $("#bookingSubServiceWrap");
  const subSelect = $("#bookingSubService");
  if (!form || !alertEl || !submitBtn) return;

  const syncSubServices = () => {
    if (!serviceSelect || !subWrap || !subSelect) return;
    const svc = String(serviceSelect.value || "").trim();
    subSelect.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.disabled = true;
    ph.selected = true;
    ph.textContent = "Select a sub-service";
    subSelect.appendChild(ph);

    const subs = BOOKING_SERVICE_SUBS[svc];
    if (!subs?.length) {
      subWrap.hidden = true;
      subSelect.disabled = true;
      subSelect.removeAttribute("required");
      return;
    }

    subWrap.hidden = false;
    subSelect.disabled = false;
    subSelect.setAttribute("required", "required");
    for (const label of subs) {
      const o = document.createElement("option");
      o.value = label;
      o.textContent = label;
      subSelect.appendChild(o);
    }
  };

  serviceSelect?.addEventListener("change", syncSubServices);
  syncSubServices();

  const fields = {
    name: form.elements.namedItem("name"),
    phone: form.elements.namedItem("phone"),
    email: form.elements.namedItem("email"),
    service: form.elements.namedItem("service"),
    subService: form.elements.namedItem("subService"),
    date: form.elements.namedItem("date"),
    message: form.elements.namedItem("message")
  };

  const getValues = () => ({
    name: String(fields.name.value || "").trim(),
    phone: normalizePhone(fields.phone.value || ""),
    email: String(fields.email.value || "").trim(),
    service: String(fields.service.value || "").trim(),
    subService: String(fields.subService?.value || "").trim(),
    date: String(fields.date.value || "").trim(),
    message: String(fields.message.value || "").trim()
  });

  const validate = () => {
    const v = getValues();
    const errors = [];

    const dateObj = parseDateTimeLocal(v.date);
    const now = new Date();

    if (!v.name) errors.push({ field: fields.name, msg: "Please enter your name." });
    if (!v.phone) errors.push({ field: fields.phone, msg: "Please enter your phone number." });
    if (!v.email || !isValidEmail(v.email))
      errors.push({ field: fields.email, msg: "Please enter a valid email address." });
    if (!v.service) errors.push({ field: fields.service, msg: "Please select a service type." });
    if (v.service && BOOKING_SERVICE_SUBS[v.service]?.length) {
      if (!v.subService || !BOOKING_SERVICE_SUBS[v.service].includes(v.subService))
        errors.push({ field: fields.subService, msg: "Please select a sub-service." });
    }
    if (!dateObj) errors.push({ field: fields.date, msg: "Please choose a preferred date/time." });
    else if (dateObj.getTime() < now.getTime() - 5 * 60 * 1000)
      errors.push({ field: fields.date, msg: "Preferred date/time should be in the future." });

    for (const f of Object.values(fields)) setFieldInvalid(f, false);
    if (errors.length) {
      for (const e of errors) setFieldInvalid(e.field, true);
      const first = errors[0].field;
      if (first && typeof first.focus === "function") first.focus();
      setAlert(alertEl, "error", errors[0].msg);
      return { ok: false };
    }

    clearAlert(alertEl);
    return { ok: true, values: { ...v, date: dateObj.toISOString() } };
  };

  const setLoading = (loading) => {
    submitBtn.disabled = loading;
    submitBtn.classList.toggle("is-loading", loading);
  };

  form.addEventListener("input", () => {
    if (!alertEl.hidden) clearAlert(alertEl);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const res = validate();
    if (!res.ok) return;

    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: res.values.name,
          phone: res.values.phone,
          email: res.values.email,
          service: res.values.service,
          subService: res.values.subService,
          date: res.values.date,
          message: res.values.message
        })
      });

      const data = await r.json().catch(() => null);
      if (!r.ok) {
        setAlert(alertEl, "error", data?.error || "Booking failed. Please try again.");
        return;
      }

      form.reset();
      syncSubServices();
      if (data?.emailSent === false) {
        setAlert(
          alertEl,
          "success",
          "Booking saved. Email to nagarjuna@nbtechsolutions.in will work after SMTP is configured on the server (.env)."
        );
      } else {
        setAlert(alertEl, "success", "Booking submitted successfully. We’ll contact you shortly.");
      }
    } catch {
      setAlert(alertEl, "error", "Network error. Please check the backend and try again.");
    } finally {
      setLoading(false);
    }
  });
}

setupNavbar();
setupRevealAnimations();
setupYear();
populateFeedbackReviews().then(() => {
  setupReviewsCarousel();
  setupFeedbackModal();
  setupFeedbackForm();
  setupBookingForm();
});

