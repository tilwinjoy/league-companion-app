/* =========================================================
   League Companion App - landing page behaviour
   1) light/dark theme toggle (defaults to system preference)
   2) fetch the newest published release and wire up the download button
   ========================================================= */
(function () {
  'use strict';

  var REPO = 'tilwinjoy/league-companion-app';
  var RELEASES_URL = 'https://github.com/' + REPO + '/releases';
  var API_URL = 'https://api.github.com/repos/' + REPO + '/releases';
  var THEME_KEY = 'lc-theme';

  var root = document.documentElement;

  /* ---------------- theme toggle ---------------- */
  var toggle = document.getElementById('theme-toggle');

  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function paintToggle(theme) {
    if (!toggle) return;
    var toLight = theme === 'dark';
    toggle.setAttribute('aria-label', toLight ? 'Switch to light theme' : 'Switch to dark theme');
    toggle.setAttribute('title', toLight ? 'Light mode' : 'Dark mode');
  }

  function setTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* private mode */ }
    }
    paintToggle(theme);
  }

  setTheme(currentTheme(), false);
  if (toggle) {
    toggle.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });
  }

  /* ---------------- download button ---------------- */
  var btn = document.getElementById('download-btn');
  var meta = document.getElementById('release-meta');

  /* Shows the "latest release" line and hides it entirely when there is nothing to say. */
  function setMeta(text) {
    if (!meta) return;
    meta.textContent = text || '';
    meta.hidden = !text;
  }

  function prettySize(bytes) {
    if (typeof bytes !== 'number' || bytes <= 0) return '';
    var mb = bytes / (1024 * 1024);
    return mb >= 1 ? mb.toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }

  /* Point the button at the releases page and render no placeholder copy. */
  function useFallback() {
    if (btn) {
      btn.href = RELEASES_URL;
      btn.removeAttribute('download');
      btn.classList.add('btn--pending');
    }
    setMeta('');
  }

  function useRelease(release) {
    var assets = release && release.assets ? release.assets : [];
    var exe = null;
    for (var i = 0; i < assets.length; i++) {
      if (/\.exe$/i.test(assets[i].name)) { exe = assets[i]; break; }
    }
    if (!exe) { useFallback(); return; }

    if (btn) {
      btn.href = exe.browser_download_url;
      btn.setAttribute('download', exe.name);
      btn.classList.remove('btn--pending');
    }

    var bits = [];
    if (release.tag_name) bits.push(release.tag_name);
    if (exe.size) bits.push(prettySize(exe.size));
    if (release.published_at) {
      try {
        bits.push(new Date(release.published_at).toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric'
        }));
      } catch (e) { /* ignore bad date */ }
    }
    setMeta(bits.length ? 'Latest release: ' + bits.join(' \u00B7 ') : 'Direct download from GitHub Releases.');
  }

  /* The /releases feed lists published releases newest-first and, unlike
     /releases/latest, still includes pre-releases. Return the first entry that
     actually ships a Windows installer. */
  function pickRelease(releases) {
    if (!Array.isArray(releases)) return null;
    for (var i = 0; i < releases.length; i++) {
      var assets = releases[i] && releases[i].assets ? releases[i].assets : [];
      for (var j = 0; j < assets.length; j++) {
        if (/\.exe$/i.test(assets[j].name)) return releases[i];
      }
    }
    return null;
  }

  function loadRelease() {
    if (typeof window.fetch !== 'function') { useFallback(); return; }
    window.fetch(API_URL, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (releases) {
        var release = pickRelease(releases);
        if (release) { useRelease(release); } else { useFallback(); }
      })
      .catch(useFallback);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRelease);
  } else {
    loadRelease();
  }
})();
