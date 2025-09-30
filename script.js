(function(){
  const loadingBar = document.querySelector(".loading-bar");
  if(loadingBar){
    const finishLoading = () => {
      if(document.body.classList.contains("is-loaded")){ return; }
      document.body.classList.add("is-loaded");
      loadingBar.addEventListener("transitionend", () => loadingBar.remove(), { once:true });
    };
    window.addEventListener("load", () => window.requestAnimationFrame(finishLoading));
    setTimeout(finishLoading, 6000);
  }

  // Lightbox: click any image to view full size
  (function initLightbox(){
    // Create overlay lazily on first use
    let overlay;
    function buildOverlay(){
      overlay = document.createElement('div');
      overlay.className = 'lightbox-overlay';
      overlay.innerHTML = `
        <div class="lightbox-content" role="dialog" aria-modal="true" aria-label="Image preview">
          <button class="lightbox-close" aria-label="Close">✕</button>
          <img class="lightbox-img" alt="" />
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e)=>{
        if(e.target === overlay || e.target.classList.contains('lightbox-close')){ close(); }
      });
      document.addEventListener('keydown',(e)=>{
        if(overlay && overlay.classList.contains('is-open') && e.key === 'Escape'){ close(); }
      });
    }
    function open(src, alt){
      if(!overlay){ buildOverlay(); }
      const img = overlay.querySelector('.lightbox-img');
      img.src = src;
      img.alt = alt || '';
      overlay.classList.add('is-open');
      document.body.classList.add('lightbox-open');
      // Focus close for accessibility
      const closeBtn = overlay.querySelector('.lightbox-close');
      if(closeBtn){ closeBtn.focus({preventScroll:true}); }
    }
    function close(){
      if(!overlay){ return; }
      overlay.classList.remove('is-open');
      document.body.classList.remove('lightbox-open');
    }
    // Delegate clicks on all images
    document.addEventListener('click',(e)=>{
      const img = e.target.closest('img');
      if(!img) return;
      // Ignore if image is part of a link already opening something
      const link = img.closest('a');
      if(link && link.getAttribute('href')) return;
      // Only react to left-click or keyboard activation
      if(e.button !== 0 && e.type === 'click') return;
      e.preventDefault();
      open(img.currentSrc || img.src, img.alt);
    });
    // Keyboard accessibility: allow Enter on focused images
    document.addEventListener('keydown',(e)=>{
      if(e.key !== 'Enter') return;
      const active = document.activeElement;
      if(active && active.tagName === 'IMG'){
        e.preventDefault();
        open(active.currentSrc || active.src, active.alt);
      }
    });
  })();

  const form = document.getElementById("applyForm");
  if(!form){ return; }

  const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbzomrKxkfzT19AFQbA48mhURBcbHWo_YBgHWnFdF6T6iwxGkIuJPLKpD58MjBtUZWmJHA/exec"; // Replace with your Apps Script URL.
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if(!prefersReduced && "IntersectionObserver" in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add("show");
          io.unobserve(e.target);
        }
      });
    }, {threshold:0.1});
    document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach(el=>el.classList.add("show"));
  }

  const summaries = Array.from(document.querySelectorAll("#faq summary"));
  summaries.forEach((s,i)=>{
    s.addEventListener("keydown",(e)=>{
      if(e.key==="ArrowDown"){ e.preventDefault(); summaries[Math.min(i+1,summaries.length-1)].focus(); }
      if(e.key==="ArrowUp"){ e.preventDefault(); summaries[Math.max(i-1,0)].focus(); }
    });
  });

  const status = document.getElementById("form-status");
  const submitBtn = form.querySelector('[type="submit"]');
  let submitting = false;

  // Toggle the "Other" text input only when "Other" is selected in hear-about-us
  const hearRadios = form.querySelectorAll("input[name='hear']");
  const hearOtherInput = document.getElementById("hear-other");
  const hearFriendInput = document.getElementById("hear-friend");
  const hearOtherWrap = document.getElementById("hear-other-wrap");
  const hearFriendWrap = document.getElementById("hear-friend-wrap");
  const hearFieldset = form.querySelector('.form-fieldset');
  // Ensure wrappers have animation class
  if(hearOtherWrap){ hearOtherWrap.classList.add("slide-toggle"); }
  if(hearFriendWrap){ hearFriendWrap.classList.add("slide-toggle"); }

  function toggleHearOther(){
    const selected = form.querySelector("input[name='hear']:checked");
  const showOther = !!selected && selected.value === "Other";
  const showFriend = !!selected && selected.value === "Friend / Family";
    if(hearOtherWrap && hearOtherInput){
      hearOtherWrap.classList.toggle("is-hidden", !showOther);
      hearOtherWrap.setAttribute("aria-hidden", !showOther ? "true" : "false");
      hearOtherInput.disabled = !showOther;
      hearOtherInput.required = showOther;
      if(!showOther){
        hearOtherInput.value = "";
        clearFieldState(hearOtherInput);
      }
    }
    if(hearFriendWrap && hearFriendInput){
      hearFriendWrap.classList.toggle("is-hidden", !showFriend);
      hearFriendWrap.setAttribute("aria-hidden", !showFriend ? "true" : "false");
      hearFriendInput.disabled = !showFriend;
      hearFriendInput.required = showFriend;
      if(!showFriend){
        hearFriendInput.value = "";
        clearFieldState(hearFriendInput);
      }
    }
    if(hearFieldset){
      hearFieldset.classList.toggle('is-compact', !(showOther || showFriend));
    }
  }
  hearRadios.forEach(r=>r.addEventListener("change", toggleHearOther));
  // Initialize state on load
  toggleHearOther();

  function showMsg(ok,msg){
    status.className = "form-msg " + (ok ? "ok" : "err");
    status.textContent = msg;
    status.style.display = "block";
  }
  function isValidEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function isValidPhone(v){ return /^[\d\s+\-()]{6,}$/.test(v); }
  function clearFieldState(el){
    if(!el) return;
    el.removeAttribute("aria-invalid");
    const wrap = el.closest(".form-field, .form-fieldset, .form-inset, .form-confirm");
    if(wrap){ wrap.classList.remove("error"); }
  }
  function setFieldError(el){
    if(!el) return;
    el.setAttribute("aria-invalid","true");
    const wrap = el.closest(".form-field, .form-fieldset, .form-inset, .form-confirm");
    if(wrap){ wrap.classList.add("error"); }
  }
  function setSubmittingState(on){
    submitting = on;
    if(submitBtn){
      submitBtn.disabled = on;
      submitBtn.classList.toggle("is-loading", on);
      submitBtn.setAttribute("aria-busy", on ? "true" : "false");
      if(on){ submitBtn.dataset.originalText = submitBtn.textContent; submitBtn.textContent = "Submitting..."; }
      else if(submitBtn.dataset.originalText){ submitBtn.textContent = submitBtn.dataset.originalText; }
    }
  }

  form.addEventListener("submit", async function(e){
    e.preventDefault();
    if(submitting){ return; }
    status.style.display="none";
    const data = new FormData(form);
    const errs = [];
    const fieldsToReset = Array.from(form.elements).filter(el=>el.name);
    fieldsToReset.forEach(clearFieldState);

    const name = data.get("name");
    const whatsapp = data.get("whatsapp");
    const email = data.get("email");
    const motivation = data.get("motivation");
    const hear = data.get("hear");
  const hearOther = data.get("hear_other");
  const hearFriend = data.get("hear_friend");
    const confirm = document.getElementById("confirm");

    if(!name){ errs.push({ field: form.elements.name, message: "Full Name is required." }); }
    if(!whatsapp || !isValidPhone(whatsapp)){
      errs.push({ field: form.elements.whatsapp, message: "Valid WhatsApp number is required." });
    }
    if(!email || !isValidEmail(email)){
      errs.push({ field: form.elements.email, message: "Valid email address is required." });
    }
    if(!motivation){ errs.push({ field: form.elements.motivation, message: "Motivation is required." }); }
    if(!hear){
      const radios = form.querySelectorAll("input[name='hear']");
      errs.push({ field: radios[0], message: "Please select how you heard about us." });
    }
    if(hear === "Other" && !hearOther){
      errs.push({ field: hearOtherInput, message: "Please specify how you heard about us." });
    }
    if(hear === "Friend / Family" && !hearFriend){
      errs.push({ field: hearFriendInput, message: "Please tell us who referred you (friend/family)." });
    }
    if(!confirm.checked){ errs.push({ field: confirm, message: "Please confirm ‘Yes, I understand.’" }); }

    if(errs.length){
      errs.forEach(({ field })=>setFieldError(field));
      showMsg(false, errs.map(({ message })=>message).join(" "));
      if(errs[0]?.field && typeof errs[0].field.focus === "function"){ errs[0].field.focus(); }
      return;
    }

    if(!SHEET_ENDPOINT){
      showMsg(false, "Submission endpoint missing. Please configure the Google Sheet URL.");
      return;
    }

  const payload = Object.fromEntries(data.entries());
  payload.timestamp = new Date().toISOString();
  payload.page_url = location.href;
  payload.referrer = document.referrer || "";
  // Idempotency key to avoid duplicate rows on retry/opaque fallback
  payload.submission_id = (crypto && crypto.randomUUID ? crypto.randomUUID() : (Date.now() + "-" + Math.random().toString(36).slice(2)));

    try{
      setSubmittingState(true);
      // If running locally (file:// or localhost), use a single opaque POST to avoid CORS console errors
      const isLocalEnv = location.protocol === "file:" || location.origin === "null" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
      if(isLocalEnv){
        try{
          await fetch(SHEET_ENDPOINT, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body: JSON.stringify(payload)
          });
          showMsg(true, "Thanks! We’ll WhatsApp you to arrange your interview slot.");
          form.reset();
          fieldsToReset.forEach(clearFieldState);
          toggleHearOther();
          return; // Skip further attempts to prevent duplicates
        } catch(_localErr){
          // fall through to standard path below
        }
      }
      // 1) Prefer simple CORS request (no preflight) using text/plain
      let response = await fetch(SHEET_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(payload)
      });

      let ok = false;
      let result = null;
      try{
        // Try to read JSON if CORS allows
        result = await response.clone().json();
        ok = response.ok && result?.success !== false;
      } catch(_readErr){
        // If blocked by CORS, treat opaque or 200-class as success
        ok = response.ok || response.type === "opaque";
      }

      // 2) Fallback: last resort use no-cors (opaque) if first attempt failed
      if(!ok){
        try{
          await fetch(SHEET_ENDPOINT, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body: JSON.stringify(payload)
          });
          ok = true; // Cannot inspect response; assume accepted
        } catch(_nocorsErr){ /* keep not ok */ }
      }

      if(ok){
        showMsg(true, "Thanks! We’ll WhatsApp you to arrange your interview slot.");
        form.reset();
        fieldsToReset.forEach(clearFieldState);
        toggleHearOther();
      } else {
        throw new Error((result && result.message) || "Submission failed");
      }
    } catch(err){
      console.error(err);
      // Fallback on network/CORS rejection: post as opaque request and assume success if no exception
      try{
        await fetch(SHEET_ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify(payload)
        });
        showMsg(true, "Thanks! We’ll WhatsApp you to arrange your interview slot.");
        form.reset();
        fieldsToReset.forEach(clearFieldState);
        toggleHearOther();
      } catch(_finalErr){
        showMsg(false, "We couldn’t submit due to a network or CORS issue. Please try again or contact us directly.");
      }
    } finally {
      setSubmittingState(false);
    }
  });
})();
