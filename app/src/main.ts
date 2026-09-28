import './styles.css';
import { config } from './config';
import { classic } from './screens/classic';
import { done } from './screens/done';
import { favourite } from './screens/favourite';
import { pose } from './screens/pose';
import type { Go } from './screens/types';
import { who } from './screens/who';
import { welcome } from './screens/welcome';
import { state, type Step, update } from './state';

const screens: Record<Step, (go: Go) => HTMLElement> = { welcome, who, pose, classic, favourite, done };

/** Never show a step whose inputs are missing (e.g. after a reload that lost the photo). */
function guard(step: Step): Step {
  const hasWho = !!state.name && !!state.email;
  const hasPhoto = !!state.photo && (state.faceStatus === 'found' || state.faceStatus === 'unavailable');
  if (step === 'welcome' || step === 'who') return step;
  if (!hasWho) return 'who';
  if (step === 'pose') return step;
  if (!hasPhoto) return 'pose';
  if (step === 'classic') return step;
  if (!state.type) return 'classic';
  if (step === 'favourite') return step;
  if (!state.publicId) return 'favourite';
  return step;
}

/** ?theme=blue|yellow picks the accent for this session; otherwise VITE_THEME. */
function applyTheme() {
  const KEY = 'booth-wizard-theme';
  let theme: string = config.theme;
  try {
    const q = new URLSearchParams(location.search).get('theme');
    if (q === 'blue' || q === 'yellow') sessionStorage.setItem(KEY, q);
    theme = sessionStorage.getItem(KEY) || theme;
  } catch {
    /* ignore */
  }
  document.documentElement.dataset.theme = theme;
}
applyTheme();

const app = document.getElementById('app')!;

const go: Go = (target) => {
  const step = guard(target);
  update({ step });
  const el = screens[step](go);
  app.replaceChildren(el);
  window.scrollTo(0, 0);
  // Move focus to the heading so screen readers announce the new step.
  (el.querySelector('h1') as HTMLElement | null)?.focus({ preventScroll: true });
};

go(state.step);
