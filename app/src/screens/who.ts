import { copy } from '../content';
import { type Employee, firstNameOf, loadEmployees, search } from '../employees';
import { state, update } from '../state';
import { isValidEmail } from '../text';
import { h, primary, stepChrome } from '../ui';
import type { Go } from './types';

export function who(go: Go): HTMLElement {
  let list: Employee[] = [];
  let active = -1;
  let results: Employee[] = [];

  const nameInput = h('input', {
    id: 'name',
    type: 'text',
    class: 'field',
    autocomplete: 'off',
    autocapitalize: 'words',
    spellcheck: 'false',
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-expanded': 'false',
    'aria-controls': 'name-list',
    'aria-describedby': 'name-help',
  });
  nameInput.value = state.name;
  const listbox = h('ul', { id: 'name-list', class: 'picker', role: 'listbox', hidden: true });
  const emailInput = h('input', {
    id: 'email',
    type: 'email',
    class: 'field',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    inputmode: 'email',
  });
  emailInput.value = state.email;
  const next = primary(copy.who.cta, () => go('pose'));

  const refresh = () => {
    const ok = !!state.name && list.some((e) => e.name === state.name) && isValidEmail(state.email);
    next.disabled = !ok;
    nameInput.classList.toggle('picked', !!state.name);
    emailInput.setAttribute('aria-invalid', String(!!emailInput.value && !isValidEmail(emailInput.value)));
  };

  const close = () => {
    listbox.hidden = true;
    nameInput.setAttribute('aria-expanded', 'false');
    nameInput.removeAttribute('aria-activedescendant');
    active = -1;
  };

  const pick = (e: Employee) => {
    update({ name: e.name, first: firstNameOf(e), email: e.email });
    nameInput.value = e.name;
    emailInput.value = e.email;
    close();
    refresh();
  };

  const renderList = () => {
    listbox.replaceChildren(
      ...results.map((e, i) =>
        h(
          'li',
          {
            id: `name-opt-${i}`,
            role: 'option',
            class: i === active ? 'active' : '',
            'aria-selected': String(i === active),
            onpointerdown: ((ev: Event) => ev.preventDefault()) as EventListener,
            onclick: (() => pick(e)) as EventListener,
          },
          e.name,
        ),
      ),
    );
    const open = results.length > 0;
    listbox.hidden = !open;
    nameInput.setAttribute('aria-expanded', String(open));
    if (active >= 0) nameInput.setAttribute('aria-activedescendant', `name-opt-${active}`);
  };

  nameInput.addEventListener('input', () => {
    // Free text is never a name: typing clears the pick until a list entry is chosen.
    if (state.name && nameInput.value !== state.name) update({ name: '', first: '' });
    results = search(list, nameInput.value);
    active = results.length ? 0 : -1;
    renderList();
    refresh();
  });
  nameInput.addEventListener('keydown', (ev) => {
    if (listbox.hidden) return;
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      const d = ev.key === 'ArrowDown' ? 1 : -1;
      active = (active + d + results.length) % results.length;
      renderList();
    } else if (ev.key === 'Enter' && active >= 0) {
      ev.preventDefault();
      pick(results[active]);
    } else if (ev.key === 'Escape') close();
  });
  nameInput.addEventListener('blur', () => setTimeout(close, 150));
  emailInput.addEventListener('input', () => {
    update({ email: emailInput.value.trim() });
    refresh();
  });

  loadEmployees().then((l) => {
    list = l;
    refresh();
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
      h('div', { class: 'combo' }, nameInput, listbox),
      h('p', { id: 'name-help', class: 'help' }, copy.who.nameHelper),
    ),
    h('div', { class: 'form-row' }, h('label', { for: 'email' }, copy.who.emailLabel), emailInput),
    h('div', { class: 'actions' }, next),
  );
}
