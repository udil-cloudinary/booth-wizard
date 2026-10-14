import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from './app';
import { Deck } from './deck';
import type { TopicsFile } from './types';

const section = (heading: string, text: string) => ({ heading, text, matches: 4 });

const data: TopicsFile = {
  cloud: 'test',
  generatedAt: '2026-10-14',
  paths: {
    ecommerce: [
      { id: 'tent', title: 'Camping tent', description: 'Fits two people.', matches: 8 },
      { id: 'mat', title: 'Yoga mat', description: 'Soft and light.', matches: 9 },
    ],
    blog: [
      { id: 'coffee', title: 'Coffee at home', sections: [section('Latte art', 'Pour slowly.'), section('Beans', 'Keep them dark.')], matches: 7 },
    ],
    doc: [
      {
        id: 'north',
        title: 'Our trip to the north',
        sections: [section('Iceland', 'We land in Iceland.'), section('Norway', 'Then Norway.'), section('Northern lights', 'At night.')],
        matches: 12,
      },
      {
        id: 'animals',
        title: 'Wild animals',
        sections: [section('Fox', 'A red fox.'), section('Whale', 'A whale.'), section('Owl', 'An owl.')],
        matches: 10,
      },
    ],
  },
};

describe('Deck', () => {
  it(`GIVEN a path with 5 topics
      WHEN 50 topics are drawn
      THEN each round of 5 shows every topic once and no topic shows twice in a row`, () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const deck = new Deck(ids, 'test-deck');
    const drawn = Array.from({ length: 50 }, () => deck.next());

    for (let r = 0; r < 10; r++) expect(new Set(drawn.slice(r * 5, r * 5 + 5)).size).toBe(5);
    for (let i = 1; i < drawn.length; i++) expect(drawn[i]).not.toBe(drawn[i - 1]);
  });

  it(`GIVEN a round was half dealt before a reload
      WHEN a new deck reads the same session
      THEN it deals the rest of that round`, () => {
    const ids = ['a', 'b', 'c', 'd'];
    const first = new Deck(ids, 'test-reload');
    const seen = [first.next(), first.next()];
    const again = new Deck(ids, 'test-reload');

    expect(new Set([...seen, again.next(), again.next()]).size).toBe(4);
  });
});

describe('/feeling-lucky', () => {
  beforeEach(() => history.replaceState(null, '', '/feeling-lucky/'));

  it(`GIVEN the page opens
      WHEN no category is picked yet
      THEN only "Need a topic?" and the 3 categories show`, () => {
    mount(document.getElementById('app')!, data);

    expect(screen.getByRole('heading', { level: 1, name: 'Need a topic?' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getByRole('link', { name: /E-commerce.*Shopify/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Blog post.*WordPress or Contentful/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Document.*Google Docs/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Spin again' })).toBeNull();
  });

  it(`GIVEN the categories show
      WHEN the visitor picks Document
      THEN the topic page shows a document title, 3 sections and where to type it`, async () => {
    const user = userEvent.setup();
    mount(document.getElementById('app')!, data);

    await user.click(screen.getByRole('link', { name: /Document/ }));

    expect(location.hash).toBe('#doc');
    expect(screen.queryByRole('link', { name: /E-commerce/ })).toBeNull();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/Our trip to the north|Wild animals/);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
    expect(screen.getByText('Create a new Google Doc')).toBeInTheDocument();
  });

  it(`GIVEN the visitor is on a topic page
      WHEN they tap Back
      THEN the 3 categories show again`, async () => {
    const user = userEvent.setup();
    mount(document.getElementById('app')!, data);

    await user.click(screen.getByRole('link', { name: /Blog post/ }));
    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByRole('link', { name: /Blog post/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Spin again' })).toBeNull();
  });

  it(`GIVEN a link that opens straight on #blog
      WHEN the page loads
      THEN the blog topic page shows`, () => {
    history.replaceState(null, '', '/feeling-lucky/#blog');
    mount(document.getElementById('app')!, data);

    expect(screen.getByRole('heading', { level: 2, name: 'Coffee at home' })).toBeInTheDocument();
    expect(screen.getByText('Open a new post in WordPress')).toBeInTheDocument();
  });

  it(`GIVEN the visitor got an e-commerce idea
      WHEN they tap Spin again
      THEN a different product shows, with its description`, async () => {
    const user = userEvent.setup();
    mount(document.getElementById('app')!, data);

    await user.click(screen.getByRole('link', { name: /E-commerce/ }));
    const first = screen.getByRole('heading', { level: 2 }).textContent;
    await user.click(screen.getByRole('button', { name: 'Spin again' }));
    const second = screen.getByRole('heading', { level: 2 }).textContent;

    expect(second).not.toBe(first);
    expect(screen.getByText(/Fits two people\.|Soft and light\./)).toBeInTheDocument();
    expect(screen.getByText('Open a new product in Shopify')).toBeInTheDocument();
  });
});
