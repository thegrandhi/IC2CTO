import { useEffect } from 'react';
import { Icon } from '../components/Icon';
import { Markdown } from '../components/Markdown';
import { CategoryPill } from '../components/ui';
import { allLessons, allQuestions, getLesson, getQuizCategory, quizCategories } from '../lib/content';
import { markLessonRead, useAppState } from '../lib/store';

export function Lessons() {
  const s = useAppState();
  const lessons = allLessons();
  const read = lessons.filter((l) => s.lessonsRead[l.id]).length;
  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <h1>Learn</h1>
          <p>
            Short lessons on the fundamentals behind system design interviews. {read}/{lessons.length} read. Everything works offline.
          </p>
        </div>
      </div>
      {quizCategories().map((cat) => {
        const inCat = lessons.filter((l) => l.category === cat.id);
        if (!inCat.length) return null;
        return (
          <div key={cat.id}>
            <div className="section-title">{cat.title}</div>
            <div className="stack" style={{ gap: 8 }}>
              {inCat.map((l) => (
                <a key={l.id} className="card lesson-link" href={`#/learn/${l.id}`} style={{ padding: '12px 16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 650 }}>{l.title}</div>
                    <div className="small muted">{l.summary}</div>
                  </div>
                  <span className="small faint">{l.minutes} min</span>
                  {s.lessonsRead[l.id] ? (
                    <span className="read" title="Read">
                      <Icon name="check" size={18} />
                    </span>
                  ) : (
                    <span style={{ width: 18 }} />
                  )}
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LessonPage({ id }: { id: string }) {
  const lesson = getLesson(id);
  const s = useAppState();
  useEffect(() => {
    if (!lesson) return;
    // Count the lesson as read once the reader reaches the end.
    const sentinel = document.getElementById('lesson-end');
    if (!sentinel) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        markLessonRead(lesson.id);
        obs.disconnect();
      }
    });
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="page">
        <div className="empty">
          <h2>Lesson not found</h2>
          <a href="#/learn">All lessons</a>
        </div>
      </div>
    );
  }
  const cat = getQuizCategory(lesson.category);
  const lessons = allLessons();
  const idx = lessons.findIndex((l) => l.id === id);
  const next = lessons[idx + 1];
  const checks = allQuestions().filter((q) => q.lesson === id).length;

  return (
    <div className="page narrow">
      <div className="row" style={{ marginBottom: 12 }}>
        <a href="#/learn" className="small muted">
          ← Learn
        </a>
        <div className="spacer" />
        {cat && <CategoryPill color={cat.color}>{cat.title}</CategoryPill>}
        <span className="small faint">{lesson.minutes} min read</span>
      </div>
      <h1>{lesson.title}</h1>
      <p className="muted" style={{ fontSize: '1.05rem', marginTop: 0 }}>
        {lesson.summary}
      </p>
      <Markdown className="lesson-body" text={lesson.body} />
      {lesson.takeaways.length > 0 && (
        <div className="takeaways">
          <strong>Key takeaways</strong>
          <ul>
            {lesson.takeaways.map((t, i) => (
              <li key={i}>
                <Markdown inline text={t} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {lesson.links.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="small faint" style={{ marginBottom: 4 }}>
            Go deeper (needs a connection)
          </div>
          <ul className="small" style={{ margin: 0, paddingLeft: 20 }}>
            {lesson.links.map((l, i) => (
              <li key={i}>
                <Markdown inline text={l} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <div id="lesson-end" />
      <hr />
      <div className="row">
        {s.lessonsRead[id] && (
          <span className="small" style={{ color: 'var(--pass)' }}>
            <Icon name="check" size={14} /> Read
          </span>
        )}
        <div className="spacer" />
        {checks > 0 && (
          <a className="btn" href={`#/quiz/lesson?lesson=${id}`}>
            <Icon name="quiz" /> Check yourself ({checks})
          </a>
        )}
        {next && (
          <a className="btn primary" href={`#/learn/${next.id}`}>
            Next: {next.title}
          </a>
        )}
      </div>
    </div>
  );
}
