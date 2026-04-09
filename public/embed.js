/**
 * MakeATale Embed Widget
 * ----------------------
 * Drop a story onto any blog or website with a single line:
 *
 *   <div data-makeatale="STORY_SLUG_OR_ID"></div>
 *   <script src="https://makeatale.com/embed.js" async></script>
 *
 * Optional: data-theme="dark" (default) or "light"
 *           data-height="600" (default 500)
 */
(function () {
  "use strict";

  var BASE = "https://makeatale.com";

  function init() {
    var elements = document.querySelectorAll("[data-makeatale]");
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.dataset.makeataleLoaded === "1") continue;
      el.dataset.makeataleLoaded = "1";

      var id = el.getAttribute("data-makeatale");
      if (!id) continue;

      var theme = el.getAttribute("data-theme") || "dark";
      var height = el.getAttribute("data-height") || "500";

      var iframe = document.createElement("iframe");
      iframe.src = BASE + "/embed/" + encodeURIComponent(id) + "?theme=" + encodeURIComponent(theme);
      iframe.style.width = "100%";
      iframe.style.maxWidth = "640px";
      iframe.style.height = height + "px";
      iframe.style.border = "1px solid " + (theme === "light" ? "#e5e7eb" : "#1f2937");
      iframe.style.borderRadius = "12px";
      iframe.style.background = theme === "light" ? "#ffffff" : "#0f172a";
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("title", "MakeATale Story");
      iframe.setAttribute("allow", "");
      iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");

      el.innerHTML = "";
      el.appendChild(iframe);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Re-scan when SPA navigations add new embed targets
  if (typeof MutationObserver !== "undefined") {
    var observer = new MutationObserver(function () { init(); });
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();
