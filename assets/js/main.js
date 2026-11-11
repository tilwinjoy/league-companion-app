/* =========================================================
   League Companion App - landing page behaviour
   1) light/dark theme toggle (defaults to system preference)
   2) fetch the newest GitHub release and wire up the download button
   ========================================================= */
(function () {
  'use strict';

  var REPO = 'tilwinjoy/league-companion-app';
  var RELEASES_URL = 'https://github.com/' + REPO + '/releases';
  var API_URL = 'https://api.github.com/repos/' + REPO + '/releases/latest';
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

  function setMeta(text) {
    if (meta) meta.textContent = text;
  }

  function prettySize(bytes) {
    if (typeof bytes !== 'number' || bytes <= 0) return '';
    var mb = bytes / (1024 * 1024);
    return mb >= 1 ? mb.toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }

  function useFallback(message) {
    if (btn) {
      btn.href = RELEASES_URL;
      btn.removeAttribute('download');
      btn.classList.add('btn--pending');
    }
    setMeta(message);
  }

  function useRelease(release) {
    var assets = release && release.assets ? release.assets : [];
    var exe = null;
    for (var i = 0; i < assets.length; i++) {
      if (/\.exe$/i.test(assets[i].name)) { exe = assets[i]; break; }
    }
    if (!exe) { useFallback('No Windows build in the latest release - see all releases on GitHub.'); return; }

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

  function loadRelease() {
    if (typeof window.fetch !== 'function') {
      useFallback('Release lookup is unavailable in this browser - download from GitHub.');
      return;
    }
    window.fetch(API_URL, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(useRelease)
      .catch(function () {
        useFallback('No published build yet - the download link appears here once a release is available.');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRelease);
  } else {
    loadRelease();
  }
})();
