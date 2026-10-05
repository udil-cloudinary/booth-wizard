import { describe, expect, it } from 'vitest';
import { buildForm } from './cloudinary';

describe('cloudinary', () => {
  it(`GIVEN a visitor's answers
      WHEN the upload form is built
      THEN it carries the preset, ID, folder, type tag and all nine metadata fields`, () => {
    const form = buildForm({
      photo: new Blob(['x'], { type: 'image/jpeg' }),
      publicId: 'maya-sol-ab12',
      visitorName: 'Maya Sol',
      firstName: 'Maya',
      email: 'maya.sol@cloudinary.com',
      productType: 'gelato',
      variant: 'pistachio',
      favorite: 'Pistachio',
    });

    expect(form.get('file')).toBeInstanceOf(Blob);
    expect(form.get('upload_preset')).toBe('booth_wizard');
    expect(form.get('public_id')).toBe('maya-sol-ab12');
    expect(form.get('asset_folder')).toBe('booth/visitors');
    expect(form.get('tags')).toBe('type-gelato');
    expect(form.get('metadata')).toBe(
      'visitor_name=Maya Sol|first_name=Maya|email=maya.sol@cloudinary.com|product_type=gelato|variant=pistachio|favorite=Pistachio|face_detected=true|tv_status=auto|print_status=none',
    );
  });
});
