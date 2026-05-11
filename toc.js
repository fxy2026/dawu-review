// === Floating TOC + Reading Progress ===
(function(){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
  function init(){
    var headings = Array.from(document.querySelectorAll('h2[id], h3[id], h2, h3'));
    if(headings.length < 2) return;
    headings = headings.filter(function(h){ return !h.closest('.nav-bar'); });
    headings.forEach(function(h, i){ if(!h.id) h.id = 'toc-sec-' + i; });
    var tocWrap = document.createElement('div');
    tocWrap.id = 'floating-toc';
    tocWrap.innerHTML = '<div id="toc-progress-wrap"><div id="toc-progress-bar"></div><span id="toc-progress-text">0%</span></div>'
      + '<div id="toc-toggle" title="\u76EE\u5F55">\u2630</div>'
      + '<div id="toc-list-wrap"><div id="toc-title">\u{1F4D1} \u672C\u7AE0\u76EE\u5F55</div><ul id="toc-list"></ul></div>';
    document.body.appendChild(tocWrap);
    var tocList = document.getElementById('toc-list');
    var tocLinks = [];
    headings.forEach(function(h){
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      var text = h.textContent.replace(/[\u{1F4D6}\u{1F3AF}]\s*/gu, '').trim();
      if(text.length > 35) text = text.substring(0, 33) + '\u2026';
      a.textContent = text;
      a.className = h.tagName === 'H3' ? 'toc-h3' : 'toc-h2';
      a.addEventListener('click', function(e){
        e.preventDefault();
        document.getElementById(h.id).scrollIntoView({behavior:'smooth', block:'start'});
        history.pushState(null, null, '#' + h.id);
      });
      li.appendChild(a);
      tocList.appendChild(li);
      tocLinks.push(a);
    });
    var headingOffsets = [];
    function cacheOffsets(){
      headingOffsets = headings.map(function(h){ return h.offsetTop; });
    }
    cacheOffsets();
    var resizeTimer;
    window.addEventListener('resize', function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(cacheOffsets, 300);
    });
    setTimeout(cacheOffsets, 1500);
    setTimeout(cacheOffsets, 4000);
    var toggle = document.getElementById('toc-toggle');
    var listWrap = document.getElementById('toc-list-wrap');
    var isOpen = window.innerWidth > 1100;
    listWrap.style.display = isOpen ? 'block' : 'none';
    toggle.addEventListener('click', function(){
      isOpen = !isOpen;
      listWrap.style.display = isOpen ? 'block' : 'none';
      toggle.textContent = isOpen ? '\u2715' : '\u2630';
    });
    var progressBar = document.getElementById('toc-progress-bar');
    var progressText = document.getElementById('toc-progress-text');
    var lastCurrent = -1;
    var scrollTimer = 0;
    function onScroll(){
      var now = Date.now();
      if(now - scrollTimer < 66) return;
      scrollTimer = now;
      var scrollTop = window.pageYOffset;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? Math.min(100, Math.round(scrollTop / docHeight * 100)) : 0;
      progressBar.style.width = progress + '%';
      progressText.textContent = progress + '%';
      var threshold = scrollTop + 120;
      var current = -1;
      for(var i = headingOffsets.length - 1; i >= 0; i--){
        if(headingOffsets[i] <= threshold){ current = i; break; }
      }
      if(current !== lastCurrent){
        if(lastCurrent >= 0 && lastCurrent < tocLinks.length) tocLinks[lastCurrent].classList.remove('toc-active');
        if(current >= 0){
          tocLinks[current].classList.add('toc-active');
          if(isOpen){
            var li = tocLinks[current].parentElement;
            var liTop = li.offsetTop - tocList.offsetTop;
            var listH = tocList.clientHeight;
            if(liTop < tocList.scrollTop || liTop > tocList.scrollTop + listH - 30) tocList.scrollTop = liTop - listH / 3;
          }
        }
        lastCurrent = current;
      }
    }
    window.addEventListener('scroll', onScroll, {passive: true});
    onScroll();
  }
})();
