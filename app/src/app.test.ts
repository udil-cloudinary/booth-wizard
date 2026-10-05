import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import type { State } from './state';
import { server } from './test/setup';

const UPLOAD_URL = 'https://api.cloudinary.com/v1_1/test-cloud/image/upload';

const visitor: Partial<State> = {
  name: 'Maya Sol',
  first: 'Maya',
  emailPrefix: 'maya.sol',
  email: 'maya.sol@cloudinary.com',
  photo: 'data:image/jpeg;base64,/9j/',
  photoW: 10,
  photoH: 10,
  faceStatus: 'found',
  type: 'gelato',
};

/** Start the real app as if the page reloaded with this progress saved. */
async function boot(saved: Partial<State>) {
  sessionStorage.setItem('booth-wizard-v2', JSON.stringify(saved));
  vi.resetModules();
  // No minimum upload time or "ready" hold: the tests check where the flow ends up.
  const { config } = await import('./config');
  Object.assign(config, { minUploadMs: 0, uploadReadyMs: 0 });
  await import('./main');
}

describe('booth wizard', () => {
  it(`GIVEN the visitor is on "Who are you?"
      WHEN they type a name and a valid email prefix
      THEN Next becomes available`, async () => {
    const user = userEvent.setup();
    await boot({ step: 'who' });

    await user.type(screen.getByLabelText('Name'), 'Maya Sol');
    await user.type(screen.getByLabelText('Email'), 'maya.sol');

    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it(`GIVEN the visitor is on "Who are you?" with a name typed
      WHEN the email prefix is malformed
      THEN Next stays unavailable`, async () => {
    const user = userEvent.setup();
    await boot({ step: 'who' });

    await user.type(screen.getByLabelText('Name'), 'Maya Sol');
    await user.type(screen.getByLabelText('Email'), 'ma..ya');

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it(`GIVEN a reload on the favourite step lost the photo
      WHEN the app starts
      THEN the visitor is sent back to the selfie step`, async () => {
    await boot({ ...visitor, step: 'favourite', photo: '' });

    expect(await screen.findByRole('heading', { name: 'Strike a pose' })).toBeInTheDocument();
  });

  it(`GIVEN the visitor is on the favourite step and the upload succeeds
      WHEN they tap a chip
      THEN the thank-you screen greets them by first name`, async () => {
    server.use(
      http.post(UPLOAD_URL, () =>
        HttpResponse.json({ public_id: 'booth/visitors/maya-sol-ab12', secure_url: '', faces: [[1, 1, 5, 5]] }),
      ),
    );
    const user = userEvent.setup();
    await boot({ ...visitor, step: 'favourite' });

    await user.click(screen.getByRole('button', { name: 'Pistachio' }));

    expect(await screen.findByRole('heading', { name: 'Grazie, Maya!' })).toBeInTheDocument();
  });

  it(`GIVEN the visitor is on the favourite step and the upload is faster than the minimum time
      WHEN they tap a chip
      THEN the progress shows, then "Your product is ready", then the thank-you screen`, async () => {
    server.use(
      http.post(UPLOAD_URL, () =>
        HttpResponse.json({ public_id: 'booth/visitors/maya-sol-ab12', secure_url: '', faces: [[1, 1, 5, 5]] }),
      ),
    );
    const user = userEvent.setup();
    await boot({ ...visitor, step: 'favourite' });
    const { config } = await import('./config');
    Object.assign(config, { minUploadMs: 400, uploadReadyMs: 400 });

    await user.click(screen.getByRole('button', { name: 'Pistachio' }));

    expect(screen.getByRole('button', { name: 'Making your product…' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Your product is ready' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Grazie, Maya!' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Grazie, Maya!' })).toBeInTheDocument();
  });

  it(`GIVEN the visitor is on the favourite step and Cloudinary returns an error
      WHEN they tap a chip
      THEN a Retry button is offered`, async () => {
    server.use(http.post(UPLOAD_URL, () => HttpResponse.json({ error: { message: 'boom' } }, { status: 500 })));
    const user = userEvent.setup();
    await boot({ ...visitor, step: 'favourite' });

    await user.click(screen.getByRole('button', { name: 'Pistachio' }));

    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it(`GIVEN the visitor is on the favourite step and Cloudinary finds no face in the selfie
      WHEN they tap a chip
      THEN they are back on the selfie step with the no-face message`, async () => {
    server.use(http.post(UPLOAD_URL, () => HttpResponse.json({ public_id: 'x', secure_url: '', faces: [] })));
    const user = userEvent.setup();
    await boot({ ...visitor, step: 'favourite' });

    await user.click(screen.getByRole('button', { name: 'Pistachio' }));

    expect(await screen.findByText('We could not find a face')).toBeInTheDocument();
  });
});
