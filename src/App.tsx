import { lazy, Suspense, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Icon, type IconName } from './components/Icon';
import { dueProblems, dueQuestions } from './lib/planner';
import { runners } from './lib/runner/runner';
import { todayStr } from './lib/srs';
import { useAppState } from './lib/store';
import { DesignList } from './pages/DesignList';
import { DesignSession } from './pages/DesignSession';
import { LessonPage, Lessons } from './pages/Lessons';
import { More } from './pages/More';
import { Problems } from './pages/Problems';
import { QuizHome } from './pages/QuizHome';
import { QuizSession } from './pages/QuizSession';
import { Review } from './pages/Review';
import { Settings } from './pages/Settings';
import { Today } from './pages/Today';
import { PYTHON_AVAILABLE } from './lib/types';
import { useRoute } from './router';
import { useApplyTheme } from './theme';

// The code editor (CodeMirror) is only loaded on pages that need it.
const ProblemPage = lazy(() => import('./pages/ProblemPage').then((m) => ({ default: m.ProblemPage })));
const Playground = lazy(() => import('./pages/Playground').then((m) => ({ default: m.Playground })));

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
  match: string;
}

/** Bottom tab bar on phones: the tap-friendly parts of the app first. */
const TABS: NavItem[] = [
  { path: '/', label: 'Today', icon: 'today', match: '' },
  { path: '/quiz/reps', label: 'Reps', icon: 'flame', match: 'reps' },
  { path: '/quiz', label: 'Quiz', icon: 'quiz', match: 'quiz' },
  { path: '/problems', label: 'Code', icon: 'code', match: 'problems' },
  { path: '/more', label: 'More', icon: 'grip', match: 'more' },
];

const NAV: NavItem[] = [
  { path: '/', label: 'Today', icon: 'today', match: '' },
  { path: '/problems', label: 'Problems', icon: 'code', match: 'problems' },
  { path: '/review', label: 'Review', icon: 'review', match: 'review' },
  { path: '/quiz', label: 'Quiz', icon: 'quiz', match: 'quiz' },
  { path: '/learn', label: 'Learn', icon: 'learn', match: 'learn' },
  { path: '/design', label: 'Design', icon: 'design', match: 'design' },
  { path: '/playground', label: 'Playground', icon: 'terminal', match: 'playground' },
];

function useOnline() {
  return useSyncExternalStore(
    (fn) => {
      window.addEventListener('online', fn);
      window.addEventListener('offline', fn);
      return () => {
        window.removeEventListener('online', fn);
        window.removeEventListener('offline', fn);
      };
    },
    () => navigator.onLine,
  );
}

function RuntimeStatus() {
  const py = useSyncExternalStore(runners.python.subscribe, runners.python.getState);
  const online = useOnline();
  const [label, cls] = !PYTHON_AVAILABLE
    ? ['Preview: JavaScript only', 'ok']
    : py.status === 'loading'
      ? [py.message || 'Loading Python…', 'busy']
      : py.status === 'busy'
        ? ['Running…', 'busy']
        : py.status === 'ready'
          ? [py.version ?? 'Python ready', 'ok']
          : py.status === 'error'
            ? ['Python failed to load', 'warn']
            : ['Python loads on demand', ''];
  return (
    <>
      <div className="status-line" title="In-browser code runtime">
        <span className={`dot ${cls}`} />
        {label}
      </div>
      {!online && (
        <div className="status-line">
          <Icon name="offline" size={14} />
          Offline
        </div>
      )}
    </>
  );
}

function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 4500);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  if (needRefresh)
    return (
      <div className="toast" role="status">
        <span>A new version of Code Gym is available.</span>
        <button className="btn primary small" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
        <button className="btn ghost small" onClick={() => setNeedRefresh(false)}>
          Later
        </button>
      </div>
    );
  if (offlineReady)
    return (
      <div className="toast" role="status" onClick={() => setOfflineReady(false)}>
        <Icon name="check" size={18} />
        <span>Ready to work offline. Python, problems and lessons are saved on this device.</span>
      </div>
    );
  return null;
}

export function App() {
  useApplyTheme();
  const route = useRoute();
  const state = useAppState();
  const today = todayStr();
  const reviewCount = useMemo(() => dueProblems(state, today).length + dueQuestions(state, today).length, [state, today]);
  const [section, id] = route.parts;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section, id]);

  // Ask the browser not to evict our local data under storage pressure.
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => undefined);
  }, []);

  let page;
  switch (section) {
    case undefined:
      page = <Today />;
      break;
    case 'problems':
      page = id ? <ProblemPage key={id + (route.query.get('mode') ?? '')} id={id} mode={route.query.get('mode')} /> : <Problems />;
      break;
    case 'review':
      page = <Review />;
      break;
    case 'quiz':
      page = id ? <QuizSession key={id + route.query.toString()} kind={id} query={route.query} /> : <QuizHome />;
      break;
    case 'learn':
      page = id ? <LessonPage key={id} id={id} /> : <Lessons />;
      break;
    case 'design':
      page = id ? <DesignSession key={id} id={id} /> : <DesignList />;
      break;
    case 'playground':
      page = <Playground />;
      break;
    case 'settings':
      page = <Settings />;
      break;
    case 'more':
      page = <More reviewCount={reviewCount} />;
      break;
    default:
      page = (
        <div className="page">
          <div className="empty">
            <h2>Page not found</h2>
            <a href="#/">Back to Today</a>
          </div>
        </div>
      );
  }

  const active = section ?? '';
  return (
    <div className="app">
      <nav className="sidebar" aria-label="Main">
        <a className="brand" href="#/">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
          <span>Code Gym</span>
        </a>
        {NAV.map((item) => (
          <a key={item.path} href={`#${item.path}`} className={`nav-link ${active === item.match ? 'active' : ''}`}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.match === 'review' && reviewCount > 0 && <span className="nav-badge">{reviewCount}</span>}
          </a>
        ))}
        <div className="sidebar-foot">
          <a href="#/settings" className={`nav-link ${active === 'settings' ? 'active' : ''}`}>
            <Icon name="settings" />
            <span>Settings</span>
          </a>
          <RuntimeStatus />
        </div>
      </nav>
      <main className="main">
        <Suspense fallback={<div className="page muted">Loading…</div>}>{page}</Suspense>
      </main>
      <nav className="tabbar" aria-label="Main">
        {TABS.map((item) => {
          const tabActive =
            item.match === 'reps'
              ? section === 'quiz' && id === 'reps'
              : item.match === 'quiz'
                ? section === 'quiz' && id !== 'reps'
                : item.match === 'more'
                  ? ['more', 'review', 'learn', 'design', 'playground', 'settings'].includes(active)
                  : active === item.match;
          return (
            <a key={item.path} href={`#${item.path}`} className={tabActive ? 'active' : ''}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.match === 'more' && reviewCount > 0 && <span className="tab-dot" />}
            </a>
          );
        })}
      </nav>
      <UpdatePrompt />
    </div>
  );
}
