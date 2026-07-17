function toggleModule(id) {
  var content = document.getElementById(id + '-content');
  content.classList.toggle('collapsed');
  var toggle = content.parentElement.querySelector('.toggle');
  if (content.classList.contains('collapsed')) {
    toggle.textContent = '\u25B6';
  } else {
    toggle.textContent = '\u25BC';
  }
  updateProgress();
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
  }
  var feedback = document.getElementById(questionId + '-feedback');
  if (feedback) {
    feedback.classList.add('show');
  }
}

function updateProgress() {}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
}

var _searchMatches = [];
var _searchCurrent = -1;
var _searchQuery = '';

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
      var headerText = h2 ? h2.textContent.toLowerCase() : '';
      for (var ti = 0; ti < terms.length; ti++) {
        if (headerText.indexOf(terms[ti]) !== -1 && h2) {
          _collectMatches(h2, terms[ti]);
        }
        if (mc) _collectMatches(mc, terms[ti]);
      }
    } else {
      mods[m].style.display = 'none';
    }
  }

  var found = orderedMods.length;
  var tightCount = tightMatches.length;
  var allCount = allMatches.length;
  var anyCount = anyMatches.length;

  _applyHighlights(q);

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

function _collectMatches(el, q) {
  var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  var nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (var n = 0; n < nodes.length; n++) {
    var node = nodes[n];
    var text = node.textContent;
    var lower = text.toLowerCase();
    var idx = lower.indexOf(q);
    while (idx !== -1) {
      _searchMatches.push({ node: node, start: idx, len: q.length });
      idx = lower.indexOf(q, idx + q.length);
    }
  }
}

function _applyHighlights(q) {
  if (!_searchMatches.length) return;
  var sorted = [];
  for (var i = 0; i < _searchMatches.length; i++) sorted.push(i);
  sorted.sort(function(a, b) {
    var na = _searchMatches[a].node;
    var nb = _searchMatches[b].node;
    if (na === nb) return _searchMatches[b].start - _searchMatches[a].start;
    var posA = _nodePosition(na);
    var posB = _nodePosition(nb);
    return posB - posA;
  });
  for (var s = 0; s < sorted.length; s++) {
    var m = _searchMatches[sorted[s]];
    var text = m.node.textContent;
    var span = document.createElement('span');
    span.className = 'search-highlight';
    span.textContent = text.substring(m.start, m.start + m.len);
    var after = document.createTextNode(text.substring(m.start + m.len));
    var before = text.substring(0, m.start);
    var frag = document.createDocumentFragment();
    if (before) frag.appendChild(document.createTextNode(before));
    frag.appendChild(span);
    if (after) frag.appendChild(after);
    m.node.parentNode.replaceChild(frag, m.node);
    _searchMatches[sorted[s]].span = span;
  }
}

function _nodePosition(node) {
  var pos = 0;
  while (node) {
    pos++;
    node = node.previousSibling || node.parentNode;
    if (node && node.classList && (node.classList.contains('module') || node.classList.contains('module-header') || node.classList.contains('module-content'))) break;
  }
  return pos;
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

function highlightInElement(el, q) {
  var children = el.querySelectorAll(':scope > *');
  for (var c = 0; c < children.length; c++) {
    var child = children[c];
    if (child.classList && (child.classList.contains('module-header') || child.tagName === 'SCRIPT')) continue;
    var walker = document.createTreeWalker(child, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (var n = 0; n < nodes.length; n++) {
      var node = nodes[n];
      var idx = node.textContent.toLowerCase().indexOf(q);
      if (idx === -1) continue;
      var span = document.createElement('span');
      span.className = 'search-highlight';
      span.textContent = node.textContent.substring(idx, idx + q.length);
      var rest = node.textContent.substring(idx + q.length);
      var before = node.textContent.substring(0, idx);
      var frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(span);
      if (rest) frag.appendChild(document.createTextNode(rest));
      node.parentNode.replaceChild(frag, node);
    }
  }
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
    links[i].classList.toggle('active', links[i].getAttribute('href') === '#' + activeId);
  }
}

window.onload = function() {
  // Restore dark mode
  if (localStorage.getItem('darkMode') === '1') {
    document.body.classList.add('dark');
    document.getElementById('darkToggle').textContent = '\u2600\uFE0F';
  }

  // Collapse all modules except first
  var modules = document.querySelectorAll('.module');
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
