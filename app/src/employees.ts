import { fold } from './text';

export interface Employee {
  name: string;
  email: string;
  first?: string;
}

let cache: Promise<Employee[]> | null = null;

export function loadEmployees(): Promise<Employee[]> {
  if (!cache) {
    cache = fetch('employees.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Employee[]) => list.filter((e) => e && e.name && e.email))
      .catch(() => {
        cache = null;
        return [];
      });
  }
  return cache;
}

export function firstNameOf(e: Employee): string {
  return (e.first || e.name.trim().split(/\s+/)[0] || '').trim();
}

/** Every typed word must be the start of a word in the name (first or last), accents ignored. */
export function search(list: Employee[], query: string, limit = 6): Employee[] {
  const q = fold(query).trim().split(/[\s-]+/).filter(Boolean);
  if (!q.length) return [];
  return list
    .filter((e) => {
      const words = fold(e.name).split(/[\s'-]+/).filter(Boolean);
      return q.every((t) => words.some((w) => w.startsWith(t)));
    })
    .slice(0, limit);
}
