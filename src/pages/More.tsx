import { Icon, type IconName } from '../components/Icon';
import { InstallCard } from '../components/InstallCard';

const LINKS: { href: string; icon: IconName; title: string; detail: string }[] = [
  { href: '#/review', icon: 'review', title: 'Review', detail: 'Problems and questions due for spaced repetition' },
  { href: '#/learn', icon: 'learn', title: 'Learn', detail: 'Bite-size lessons on system design fundamentals' },
  { href: '#/design', icon: 'design', title: 'Design', detail: 'Full mock design interviews with a whiteboard' },
  { href: '#/playground', icon: 'terminal', title: 'Playground', detail: 'Scratchpad for Python and JavaScript' },
  { href: '#/settings', icon: 'settings', title: 'Settings', detail: 'Theme, language, backup and offline status' },
];

export function More({ reviewCount }: { reviewCount: number }) {
  return (
    <div className="page narrow">
      <h1>More</h1>
      <div className="stack" style={{ gap: 8, marginBottom: 20 }}>
        {LINKS.map((l) => (
          <a key={l.href} className="card lesson-link" href={l.href} style={{ padding: '14px 16px' }}>
            <Icon name={l.icon} size={20} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 650 }}>{l.title}</div>
              <div className="small muted">{l.detail}</div>
            </div>
            {l.title === 'Review' && reviewCount > 0 && <span className="nav-badge">{reviewCount}</span>}
            <Icon name="right" size={16} />
          </a>
        ))}
      </div>
      <InstallCard />
    </div>
  );
}
