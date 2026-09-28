import { config } from '../config';
import { copy } from '../content';
import { state, update } from '../state';
import { cleanName, firstNameOf, isValidEmailPrefix, normalizeEmailPrefix } from '../text';
import { h, primary, stepChrome } from '../ui';
import type { Go } from './types';

const NAME_MAX = 40;

export function who(go: Go): HTMLElement {
  const nameInput = h('input', {
    id: 'name',
    type: 'text',
    class: 'field',
    maxlength: NAME_MAX,
    autocomplete: 'name',
    autocapitalize: 'words',
    spellcheck: 'false',
    enterkeyhint: 'next',
    'aria-describedby': 'name-help',
  });
  nameInput.value = state.name;

  // Only the part before the @ is typed; the company domain is fixed.
  const emailInput = h('input', {
    id: 'email',
    type: 'text',
    class: 'field email-prefix',
    autocomplete: 'off',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    inputmode: 'email',
    enterkeyhint: 'done',
    'aria-describedby': 'email-domain',
  });
  emailInput.value = state.emailPrefix;
  const next = primary(copy.who.cta, () => go('pose'));

  const emailField = h(
    'div',
    { class: 'email-field', onclick: (() => emailInput.focus()) as EventListener },
    emailInput,
    h('span', { id: 'email-domain', class: 'email-domain' }, `@${config.emailDomain}`),
  );

  const refresh = () => {
    next.disabled = !(state.name && state.first && state.email);
    const p = emailInput.value;
    emailField.classList.toggle('invalid', !!p && !isValidEmailPrefix(p));
  };

  nameInput.addEventListener('input', () => {
    const name = cleanName(nameInput.value);
    update({ name, first: firstNameOf(name) });
    refresh();
  });
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') emailInput.focus();
  });

  emailInput.addEventListener('input', () => {
    // A pasted full address keeps only the prefix.
    const prefix = normalizeEmailPrefix(emailInput.value);
    if (prefix !== emailInput.value) emailInput.value = prefix;
    update({ emailPrefix: prefix, email: isValidEmailPrefix(prefix) ? `${prefix}@${config.emailDomain}` : '' });
    refresh();
  });
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') emailInput.blur();
  });

  refresh();

  return h(
    'main',
    { class: 'screen who' },
    stepChrome(1, () => go('welcome')),
    h('h1', { tabindex: -1 }, copy.who.title),
    h('p', { class: 'lead' }, copy.who.body),
    h(
      'div',
      { class: 'form-row' },
      h('label', { for: 'name' }, copy.who.nameLabel),
      nameInput,
      h('p', { id: 'name-help', class: 'help' }, copy.who.nameHelper),
    ),
    h('div', { class: 'form-row' }, h('label', { for: 'email' }, copy.who.emailLabel), emailField),
    h('div', { class: 'actions' }, next),
  );
}
