(function(){
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

  const form = document.getElementById("applyForm");
  const status = document.getElementById("form-status");
  function showMsg(ok,msg){
    status.className = "form-msg " + (ok ? "ok" : "err");
    status.textContent = msg;
    status.style.display = "block";
  }
  function isValidEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function isValidPhone(v){ return /^[\d\s+\-()]{6,}$/.test(v); }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    status.style.display="none";
    const data = new FormData(form);
    const errs = [];

    if(!data.get("name")) errs.push("Full Name is required.");
    if(!data.get("whatsapp") || !isValidPhone(data.get("whatsapp"))) errs.push("Valid WhatsApp number is required.");
    if(!data.get("email") || !isValidEmail(data.get("email"))) errs.push("Valid Email is required.");
    if(!data.get("motivation")) errs.push("Motivation is required.");
    if(!data.get("hear")) errs.push("Please select how you heard about us.");
    if(!document.getElementById("confirm").checked) errs.push("Please confirm “Yes, I understand.”");

    if(errs.length){
      showMsg(false, errs.join(" "));
      return;
    }

    showMsg(true, "Thanks! We’ll WhatsApp you to arrange your interview slot.");
    form.reset();
  });
})();