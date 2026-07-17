function toggleModule(id) {
  var content = document.getElementById(id + '-content');
  content.classList.toggle('collapsed');
  var toggle = content.parentElement.querySelector('.toggle');
  if (content.classList.contains('collapsed')) {
    toggle.textContent = '\u25B6';
  } else {
    toggle.textContent = '\u25BC';
  }
}

function checkAnswer(el, correct, questionId) {
  var options = el.parentElement.querySelectorAll('.option');
  for (var i = 0; i < options.length; i++) {
    options[i].style.pointerEvents = 'none';
  }
  if (correct) {
    el.classList.add('correct');
  } else {
    el.classList.add('wrong');
    for (var j = 0; j < options.length; j++) {
      var onclickAttr = options[j].getAttribute('onclick');
      if (onclickAttr && onclickAttr.indexOf(', true,') !== -1) {
        options[j].classList.add('correct');
      }
    }
  }
  var feedback = document.getElementById(questionId + '-feedback');
  if (feedback) {
    var strong = feedback.querySelector('strong');
    if (strong && strong.textContent.indexOf('Correct') !== -1) {
      strong.textContent = correct ? '✓ Correct!' : '✗ Incorrect!';
    }
    feedback.classList.add('show');
  }
}

function toggleSidebar() {
  var sb = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  var isMobile = window.innerWidth <= 768;

  if (isMobile) {
    var isOpen = sb.classList.contains('open');
    if (isOpen) {
      sb.classList.remove('open');
      overlay.classList.remove('show');
      document.body.classList.remove('sidebar-hidden');
    } else {
      sb.classList.add('open');
      overlay.classList.add('show');
      document.body.classList.add('sidebar-hidden');
    }
  } else {
    var isCollapsed = sb.classList.contains('collapsed');
    if (isCollapsed) {
      sb.classList.remove('collapsed');
      document.body.classList.remove('sidebar-hidden');
    } else {
      sb.classList.add('collapsed');
      document.body.classList.add('sidebar-hidden');
    }
  }
}

function focusModule(id) {
  var mods = document.querySelectorAll('.module');
  for (var i = 0; i < mods.length; i++) {
    mods[i].style.display = mods[i].id === id ? '' : 'none';
    if (mods[i].id === id) {
      var content = mods[i].querySelector('.module-content');
      if (content) content.classList.remove('collapsed');
      var toggle = mods[i].querySelector('.toggle');
      if (toggle) toggle.textContent = '\u25BC';
    }
  }
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  }
  // Show "show all" banner
  var banner = document.getElementById('focusBanner');
  banner.style.display = 'block';
  var label = document.querySelector('.module[id="' + id + '"] .module-header h2');
  banner.innerHTML = 'Showing: <strong>' + (label ? label.textContent : id) + '</strong> &middot; <a href="#" onclick="event.preventDefault(); showAllModules()">Show all modules</a>';
  // Scroll to the module
  document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Update sidebar active
  var links = document.querySelectorAll('.sidebar-nav a');
  for (var i = 0; i < links.length; i++) {
    links[i].classList.toggle('active', links[i].getAttribute('onclick') && links[i].getAttribute('onclick').indexOf(id) !== -1);
  }
}

function showAllModules() {
  var mods = document.querySelectorAll('.module');
  for (var i = 0; i < mods.length; i++) {
    mods[i].style.display = '';
  }
  document.getElementById('focusBanner').style.display = 'none';
  // Clear sidebar active
  var links = document.querySelectorAll('.sidebar-nav a');
  for (var i = 0; i < links.length; i++) links[i].classList.remove('active');
}

var _searchMatches = [];
var _searchCurrent = -1;
var _searchQuery = '';
var _searchTimer = null;

function _sameSentence(text, terms) {
  var sentences = text.split(/[.!?]\s+/);
  for (var s = 0; s < sentences.length; s++) {
    var allHere = true;
    for (var t = 0; t < terms.length; t++) {
      if (sentences[s].indexOf(terms[t]) === -1) { allHere = false; break; }
    }
    if (allHere) return true;
  }
  return false;
}

function searchModules() {
  if (_searchTimer) clearTimeout(_searchTimer);
  _searchTimer = setTimeout(_doSearch, 200);
}

function _doSearch() {
  _searchTimer = null;
  var q = document.getElementById('searchInput').value.toLowerCase().trim();
  var terms = q ? q.split(/\s+/).filter(function(t) { return t.length > 0; }) : [];
  var clearBtn = document.getElementById('clearBtn');
  var searchNav = document.getElementById('searchNav');
  clearBtn.style.display = q ? 'inline' : 'none';

  var highlights = document.querySelectorAll('.search-highlight');
  for (var h = 0; h < highlights.length; h++) {
    var parent = highlights[h].parentNode;
    parent.replaceChild(document.createTextNode(highlights[h].textContent), highlights[h]);
    parent.normalize();
  }
  _searchMatches = [];
  _searchCurrent = -1;
  _searchQuery = q;

  if (!q || terms.length === 0) {
    var mods = document.querySelectorAll('.module');
    for (var m = 0; m < mods.length; m++) { mods[m].style.display = ''; }
    var noRes = document.getElementById('noSearchResults');
    if (noRes) noRes.style.display = 'none';
    searchNav.style.display = 'none';
    document.getElementById('searchResultsPanel').style.display = 'none';
    return;
  }

  var multiTerm = terms.length > 1;
  mods = document.querySelectorAll('.module');
  var tightMatches = [];
  var allMatches = [];
  var anyMatches = [];

  for (var m = 0; m < mods.length; m++) {
    var text = mods[m].textContent.toLowerCase();

    if (multiTerm) {
      var allInModule = true;
      var anyInModule = false;
      for (var ti = 0; ti < terms.length; ti++) {
        var found = text.indexOf(terms[ti]) !== -1;
        if (!found) allInModule = false;
        if (found) anyInModule = true;
      }

      if (allInModule) {
        if (_sameSentence(text, terms)) {
          tightMatches.push(m);
        } else {
          allMatches.push(m);
        }
      } else if (anyInModule) {
        anyMatches.push(m);
      }
    } else {
      if (text.indexOf(terms[0]) !== -1) {
        tightMatches.push(m);
      }
    }
  }

  var orderedMods = tightMatches.concat(allMatches, multiTerm ? anyMatches : []);
  var shown = {};
  for (var i = 0; i < orderedMods.length; i++) shown[orderedMods[i]] = true;

  for (var m = 0; m < mods.length; m++) {
    if (shown[m]) {
      mods[m].style.display = '';
      var content = mods[m].querySelector('.module-content');
      if (content) content.classList.remove('collapsed');
      var toggle = mods[m].querySelector('.toggle');
      if (toggle) toggle.textContent = '\u25BC';

      var mc = mods[m].querySelector('.module-content');
      var h2 = mods[m].querySelector('.module-header h2');
      for (var ti = 0; ti < terms.length; ti++) {
        if (h2) _highlightTextNodes(h2, terms[ti]);
        if (mc) _highlightTextNodes(mc, terms[ti]);
      }
    } else {
      mods[m].style.display = 'none';
    }
  }

  var found = orderedMods.length;
  var tightCount = tightMatches.length;
  var allCount = allMatches.length;
  var anyCount = anyMatches.length;

  // Show results panel
  var panel = document.getElementById('searchResultsPanel');
  if (found > 0) {
    panel.style.display = 'block';
    var html = '<strong>\uD83D\uDD0D Results</strong>';
    if (multiTerm) {
      var parts = [];
      if (tightCount > 0) parts.push('<span class="result-badge result-tight">' + tightCount + ' same sentence</span>');
      if (allCount > 0) parts.push('<span class="result-badge result-module">' + allCount + ' same module</span>');
      if (anyCount > 0) parts.push('<span class="result-badge result-any">' + anyCount + ' partial</span>');
      html += ' ' + parts.join(' ');
    } else {
      html += ' <span class="result-badge result-tight">' + found + ' modules</span>';
    }
    html += ' <span class="result-count">' + _searchMatches.length + ' matches</span>';
    panel.innerHTML = html;

    // Scroll to first result
    var firstMod = document.querySelector('.module[style*="display: block"], .module[style*="display: "]');
    if (!firstMod) {
      var allMods = document.querySelectorAll('.module');
      for (var i = 0; i < allMods.length; i++) {
        if (allMods[i].style.display !== 'none') { firstMod = allMods[i]; break; }
      }
    }
    if (firstMod) firstMod.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    panel.style.display = 'none';
  }

  var noRes = document.getElementById('noSearchResults');
  if (found === 0) {
    if (!noRes) {
      noRes = document.createElement('div');
      noRes.id = 'noSearchResults';
      noRes.className = 'no-search-results';
      noRes.textContent = 'No results found for "' + q + '"';
      document.querySelector('.container').appendChild(noRes);
    } else {
      noRes.style.display = 'block';
      noRes.textContent = 'No results found for "' + q + '"';
    }
    searchNav.style.display = 'none';
  } else {
    if (noRes) noRes.style.display = 'none';
    if (_searchMatches.length > 1) {
      searchNav.style.display = 'flex';
    } else {
      searchNav.style.display = 'none';
    }
    if (_searchMatches.length > 0) {
      _searchCurrent = 0;
      _scrollToMatch(0);
      _updateMatchCount();
    }
  }
}

function _highlightTextNodes(el, q) {
  var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  var ql = q.toLowerCase();
  var nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (var n = 0; n < nodes.length; n++) {
    var node = nodes[n];
    var text = node.textContent;
    var lower = text.toLowerCase();
    var idx = lower.indexOf(ql);
    if (idx === -1) continue;
    var frag = document.createDocumentFragment();
    var last = 0;
    while (idx !== -1) {
      if (idx > last) frag.appendChild(document.createTextNode(text.substring(last, idx)));
      var span = document.createElement('span');
      span.className = 'search-highlight';
      span.textContent = text.substring(idx, idx + ql.length);
      frag.appendChild(span);
      _searchMatches.push({ span: span });
      last = idx + ql.length;
      idx = lower.indexOf(ql, last);
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.substring(last)));
    node.parentNode.replaceChild(frag, node);
  }
}

function _scrollToMatch(idx) {
  if (idx < 0 || idx >= _searchMatches.length) return;
  var m = _searchMatches[idx];
  var el = m.span;
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  var allSpans = document.querySelectorAll('.search-highlight');
  for (var i = 0; i < allSpans.length; i++) {
    allSpans[i].classList.remove('active');
  }
  if (m.span) m.span.classList.add('active');
}

function _updateMatchCount() {
  document.getElementById('matchCount').textContent = (_searchCurrent + 1) + '/' + _searchMatches.length;
}

function nextMatch() {
  if (_searchMatches.length === 0) return;
  _searchCurrent = (_searchCurrent + 1) % _searchMatches.length;
  _scrollToMatch(_searchCurrent);
  _updateMatchCount();
}

function prevMatch() {
  if (_searchMatches.length === 0) return;
  _searchCurrent = (_searchCurrent - 1 + _searchMatches.length) % _searchMatches.length;
  _scrollToMatch(_searchCurrent);
  _updateMatchCount();
}

function switchTab(tabId, el) {
  var parent = el.parentElement;
  var tabs = parent.querySelectorAll('.tab');
  for (var i = 0; i < tabs.length; i++) { tabs[i].classList.remove('active'); }
  el.classList.add('active');
  var contents = parent.parentElement.querySelectorAll('.tab-content');
  for (var i = 0; i < contents.length; i++) { contents[i].classList.remove('active'); }
  document.getElementById(tabId).classList.add('active');
}

function toggleTheoryRef() {
  var ref = document.getElementById('theoryRef');
  ref.classList.toggle('open');
  if (ref.classList.contains('open')) {
    ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  searchModules();
  document.getElementById('searchInput').focus();
}

function toggleDark() {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark') ? '1' : '0');
  document.getElementById('darkToggle').textContent = document.body.classList.contains('dark') ? '\u2600\uFE0F' : '\uD83C\uDF19';
}

// Track scroll position for sidebar active link
function updateSidebarActive() {
  var modules = document.querySelectorAll('.module');
  var scrollY = window.scrollY + 120;
  var activeId = null;
  for (var i = 0; i < modules.length; i++) {
    var rect = modules[i].getBoundingClientRect();
    var top = rect.top + window.scrollY;
    if (scrollY >= top - 100) {
      activeId = modules[i].id;
    }
  }
  var links = document.querySelectorAll('.sidebar-nav a');
  for (var i = 0; i < links.length; i++) {
    links[i].classList.toggle('active', links[i].getAttribute('onclick') && links[i].getAttribute('onclick').indexOf(activeId) !== -1);
  }
}

window.onload = function() {
  // Restore dark mode
  if (localStorage.getItem('darkMode') === '1') {
    document.body.classList.add('dark');
    document.getElementById('darkToggle').textContent = '\u2600\uFE0F';
  }

  // Wrap tables in scrollable containers (only on mobile)
  if (window.innerWidth <= 768) {
    var tables = document.querySelectorAll('.comparison-table');
    for (var i = 0; i < tables.length; i++) {
      var wrapper = document.createElement('div');
      wrapper.className = 'table-scroll-wrapper';
      tables[i].parentNode.insertBefore(wrapper, tables[i]);
      wrapper.appendChild(tables[i]);
    }
  }

  var modules = document.querySelectorAll('.module');
  var isQuestionBank = document.querySelector('.question-bank-hero') !== null;

  if (isQuestionBank) {
    // Question bank: expand all modules
    for (var i = 0; i < modules.length; i++) {
      modules[i].querySelector('.module-content').classList.remove('collapsed');
    }
    // Setup scroll listener for sidebar
    window.addEventListener('scroll', updateSidebarActive);
    return;
  }

  // Guide: collapse all modules except first
  for (var i = 0; i < modules.length; i++) {
    var content = modules[i].querySelector('.module-content');
    if (i === 0) {
      content.classList.remove('collapsed');
    } else {
      content.classList.add('collapsed');
    }
  }

  // Setup scroll listener for sidebar
  window.addEventListener('scroll', updateSidebarActive);
};
