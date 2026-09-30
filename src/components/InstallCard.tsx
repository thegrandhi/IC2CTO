import { useInstall } from '../lib/install';
import { Icon } from './Icon';

/** Explains how to put Code Gym on the home screen, with a one-tap install where the browser supports it. */
export function InstallCard() {
  const install = useInstall();
  if (install.installed) {
    return (
      <div className="card row">
        <Icon name="check" size={18} />
        <span>Installed. Code Gym runs from your home screen, even offline.</span>
      </div>
    );
  }
  return (
    <div className="card stack">
      <div className="row">
        <Icon name="download" size={18} />
        <strong>Install on this device</strong>
      </div>
      <p className="muted small" style={{ margin: 0 }}>
        Install the app for full-screen use and offline access on the train, on a plane, or between sets at the gym.
      </p>
      {install.canPrompt ? (
        <div>
          <button className="btn primary" onClick={() => install.prompt()}>
            Install Code Gym
          </button>
        </div>
      ) : install.ios ? (
        <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            Open this page in <b>Safari</b>.
          </li>
          <li>
            Tap the <b>Share</b> button, then <b>Add to Home Screen</b>.
          </li>
        </ol>
      ) : (
        <p className="small" style={{ margin: 0 }}>
          Use your browser menu: <b>Install app</b> (Chrome, Edge) or <b>Add to Home Screen</b> (Android).
        </p>
      )}
    </div>
  );
}
