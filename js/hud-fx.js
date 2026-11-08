/* 乘异里 · HUD 动态增强脚本
   - 指针光斑 / 全息环视差 / 环心坐标读数
   - 卡片四角括号、下载卡扫描线注入
   - 表格行入场上浮
   - 右侧章节刻度尺
   全部为渐进增强：脚本失败时页面与静态版完全一致。 */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || doc).querySelectorAll(s)); };
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  /* ---------- 0. 注入氛围层 ---------- */
  function boot() {
    doc.body.classList.add("fx-ready");
    var glow = doc.createElement("div");
    glow.className = "fx-glow";
    glow.setAttribute("aria-hidden", "true");
    doc.body.appendChild(glow);
  }

  /* ---------- 1. 指针光斑 + 全息环视差 + 坐标读数 ---------- */
  function pointerFx() {
    if (reduce) return;
    var hud = $(".hud"), xy = null;
    if (hud) {
      xy = doc.createElement("div");
      xy.className = "hud-xy";
      xy.innerHTML = '<b id="fx-x">X 0.500</b><i id="fx-y">Y 0.500</i>';
      hud.appendChild(xy);
    }
    var tx = 0, ty = 0, cx = 0, cy = 0, queued = false;

    function apply() {
      queued = false;
      var w = window.innerWidth || 1440, h = window.innerHeight || 900;
      root.style.setProperty("--mx", (tx * 100).toFixed(2) + "%");
      root.style.setProperty("--my", (ty * 100).toFixed(2) + "%");
      if (hud) {
        /* 视差：以屏幕中心为原点，最大 ±12px */
        var dx = (tx - 0.5) * 24, dy = (ty - 0.5) * 18;
        cx += (dx - cx) * 0.12;
        cy += (dy - cy) * 0.12;
        hud.style.setProperty("--hx", cx.toFixed(2) + "px");
        hud.style.setProperty("--hy", cy.toFixed(2) + "px");
        var ex = $("#fx-x"), ey = $("#fx-y");
        if (ex) ex.textContent = "X " + tx.toFixed(3);
        if (ey) ey.textContent = "Y " + ty.toFixed(3);
      }
    }
    function onMove(e) {
      var w = window.innerWidth || 1440, h = window.innerHeight || 900;
      tx = Math.min(1, Math.max(0, e.clientX / w));
      ty = Math.min(1, Math.max(0, e.clientY / h));
      if (!queued) { queued = true; raf(apply); }
    }
    doc.addEventListener("pointermove", onMove, { passive: true });
  }

  /* ---------- 2. 卡片四角括号 + 扫描线 ---------- */
  function injectCorners() {
    $$(".card, .dl, .genre").forEach(function (el) {
      if (el.querySelector(":scope > .cnr")) return;
      ["tl", "tr", "bl", "br"].forEach(function (k) {
        var i = doc.createElement("i");
        i.className = "cnr " + k;
        i.setAttribute("aria-hidden", "true");
        el.appendChild(i);
      });
      if (el.classList.contains("dl")) {
        var s = doc.createElement("i");
        s.className = "dl-scan";
        s.setAttribute("aria-hidden", "true");
        el.appendChild(s);
      }
    });
  }

  /* ---------- 3. 表格行入场上浮 ---------- */
  function tableStagger() {
    var rows = $$(".tbl tbody tr");
    if (!rows.length) return;
    if (reduce || !("IntersectionObserver" in window)) return;
    doc.body.classList.add("fx-tbl-armed");
    rows.forEach(function (tr, i) { tr.style.setProperty("--i", i % 14); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    rows.forEach(function (tr) { io.observe(tr); });
    /* 兜底：3 秒后全部显形，避免任何情况下表格空白 */
    setTimeout(function () { rows.forEach(function (tr) { tr.classList.add("in"); }); }, 3000);
  }

  /* ---------- 4. 右侧章节刻度尺 ---------- */
  function sectionRail() {
    var secs = $$("section[id]");
    if (secs.length < 2) return;
    var rail = doc.createElement("nav");
    rail.className = "sec-rail";
    rail.setAttribute("aria-label", "章节导航");
    var links = secs.map(function (s) {
      var title = s.getAttribute("data-title");
      if (!title) {
        var h2 = s.querySelector("h2");
        if (h2) {
          /* h2 通常含中文主标题 + 英文副标题，只取中文段落，避免刻度尺串行 */
          var cn = (h2.textContent || "").replace(/[A-Za-z0-9:·\/\-\.\s]/g, "").trim();
          title = (cn || (h2.textContent || "").trim()).slice(0, 5);
        } else {
          title = s.id || "";
        }
      }
      var a = doc.createElement("a");
      a.href = "#" + s.id;
      a.innerHTML = "<span>" + title + "</span>";
      rail.appendChild(a);
      return { a: a, s: s };
    });
    doc.body.appendChild(rail);

    function tick() {
      var y = window.pageYOffset + window.innerHeight * 0.34, cur = -1;
      for (var i = 0; i < links.length; i++) {
        if (links[i].s.offsetTop <= y) cur = i;
      }
      links.forEach(function (l, i) { l.a.classList.toggle("on", i === cur); });
    }
    var t = false;
    window.addEventListener("scroll", function () {
      if (t) return; t = true;
      raf(function () { tick(); t = false; });
    }, { passive: true });
    tick();
  }

  /* ---------- 5. 背景网格随滚动位移 ---------- */
  function backdropParallax() {
    if (reduce) return;
    var t = false;
    window.addEventListener("scroll", function () {
      if (t) return; t = true;
      raf(function () {
        root.style.setProperty("--sy", (window.pageYOffset || 0).toFixed(0));
        t = false;
      });
    }, { passive: true });
  }

  function start() {
    try { boot(); } catch (e) {}
    try { pointerFx(); } catch (e) {}
    try { injectCorners(); } catch (e) {}
    try { sectionRail(); } catch (e) {}
    try { tableStagger(); } catch (e) {}
    try { backdropParallax(); } catch (e) {}
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
