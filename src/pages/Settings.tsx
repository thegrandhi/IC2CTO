import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { InstallCard } from '../components/InstallCard';
import { allDesigns, allLessons, allProblems, allQuestions } from '../lib/content';
import { exportBackup, importBackup, resetAll, storageWorks, updateSettings, useAppState, type Backup } from '../lib/store';
import { LANG_LABEL, LANGS } from '../lib/types';

function useStorageInfo() {
  const [info, setInfo] = useState<{ usage?: number; quota?: number; persisted?: boolean; sw?: boolean }>({});
  useEffect(() => {
    (async () => {
      const est = await navigator.storage?.estimate?.().catch(() => undefined);
      const persisted = await navigator.storage?.persisted?.().catch(() => undefined);
      const sw = !!(await navigator.serviceWorker?.getRegistration?.().catch(() => undefined))?.active;
      setInfo({ usage: est?.usage, quota: est?.quota, persisted, sw });
    })();
  }, []);
  return info;
}

const mb = (n?: number) => (n === undefined ? '?' : `${(n / 1024 / 1024).toFixed(1)} MB`);

export function Settings() {
  const s = useAppState();
  const info = useStorageInfo();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const download = () => {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-gym-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const upload = async (file: File) => {
    try {
      const backup = JSON.parse(await file.text()) as Backup;
      if (!confirm('Replace all progress on this device with the backup?')) return;
      importBackup(backup);
      setMsg('Backup restored.');
    } catch (e) {
      setMsg(`Could not restore: ${(e as Error).message}`);
    }
  };

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Everything is stored on this device. Nothing is sent anywhere.</p>
        </div>
      </div>

      <div className="section-title">Preferences</div>
      <div className="card stack">
        <div className="row">
          <span style={{ flex: 1 }}>Default language</span>
          <div className="seg">
            {LANGS.map((l) => (
              <button key={l} className={s.settings.lang === l ? 'on' : ''} onClick={() => updateSettings({ lang: l })}>
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <span style={{ flex: 1 }}>Theme</span>
          <div className="seg">
            {(['system', 'light', 'dark'] as const).map((t) => (
              <button key={t} className={s.settings.theme === t ? 'on' : ''} onClick={() => updateSettings({ theme: t })}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <span style={{ flex: 1 }}>Editor font size</span>
          <div className="seg">
            {[12, 13, 14, 15, 16, 18].map((n) => (
              <button key={n} className={s.settings.fontSize === n ? 'on' : ''} onClick={() => updateSettings({ fontSize: n })}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-title">Offline</div>
      <div className="card stack">
        <div className="row">
          <span className={`dot ${info.sw ? 'ok' : 'warn'}`} />
          <span>
            {info.sw
              ? 'Installed for offline use. The app, the Python runtime and all content are cached on this device.'
              : 'Offline cache not active yet. Open the app from a production build (npm run build && npm run preview) or a hosted copy.'}
          </span>
        </div>
        <div className="small muted">
          Storage used: {mb(info.usage)} of {mb(info.quota)} available
          {info.persisted !== undefined && ` · ${info.persisted ? 'protected from automatic cleanup' : 'the browser may clear it under storage pressure'}`}
          .
        </div>
        {!storageWorks() && <div className="callout bad small">Saving to local storage failed. Private browsing mode can cause this.</div>}
      </div>

      <div style={{ marginTop: 12 }}>
        <InstallCard />
      </div>

      <div className="section-title">Backup</div>
      <div className="card stack">
        <p className="muted small" style={{ margin: 0 }}>
          Progress lives in this browser only. Export a backup to move it to another device, or before clearing browser data.
        </p>
        <div className="row">
          <button className="btn" onClick={download}>
            <Icon name="download" /> Export backup
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" /> Restore from file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = '';
            }}
          />
          <div className="spacer" />
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('Erase all progress, drafts and notes on this device? This cannot be undone.')) {
                resetAll();
                setMsg('All progress erased.');
              }
            }}
          >
            <Icon name="trash" /> Reset everything
          </button>
        </div>
        {msg && <div className="callout small">{msg}</div>}
      </div>

      <div className="section-title">Library</div>
      <div className="card small muted">
        {allProblems().length} coding problems · {allQuestions().length} quiz questions · {allLessons().length} lessons · {allDesigns().length} design
        prompts. Content lives in Markdown files under <code>content/</code>, so adding your own takes a new file.
      </div>
    </div>
  );
}
