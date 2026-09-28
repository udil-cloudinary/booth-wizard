import './styles.css';
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
