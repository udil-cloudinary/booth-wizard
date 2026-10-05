// All visitor-facing copy, verbatim from WIZARD-CONTENT.md. Do not edit here
// without updating that doc first.

export type ProductType = 'pizza' | 'gelato' | 'caffe';

export const PRODUCT_TYPES: ProductType[] = ['pizza', 'gelato', 'caffe'];

export const copy = {
  brand: 'Cloudinary',
  brandAccent: 'Everywhere',
  back: 'Back',
  welcome: {
    title: 'Ciao! Become an Italian classic.',
    body: 'Take a selfie and pick your flavour. Then head to a station and make it real, with an AI agent or right inside the tools you already use.',
    pills: ['60 seconds', 'magnet + keychain'],
    cta: 'Start',
  },
  who: {
    title: 'Who are you?',
    body: 'Your first name goes on your product label.',
    nameLabel: 'Name',
    nameHelper: 'Use the name you go by. Remember it, you will type it at the station.',
    emailLabel: 'Email',
    cta: 'Next',
  },
  pose: {
    title: 'Strike a pose',
    body: 'This face is about to be famous.',
    success: 'Face found. Looking great, {first}',
    failTitle: 'We could not find a face',
    failBody: 'Face the camera, find some light, and keep sunglasses off for a second.',
    // Button labels for the two capture paths (build prompt).
    takeSelfie: 'Take a selfie',
    library: 'Choose from library',
    retake: 'Retake',
    cta: 'Next',
  },
  classic: {
    title: 'Pick your Italian classic',
    body: 'It becomes your product, with your face on the label.',
  },
  favourite: {
    helper: 'One tap, or write your own.',
    writeOwn: 'Write your own',
    previewCaption: 'YOUR PRODUCT',
    previewNote: 'Your selfie goes in the sticker.',
    cta: 'Make my product',
    retry: 'Retry',
  },
  done: {
    title: 'Grazie, {first}!',
    // The intro shows `saved` word by word; the stations view then opens with `body`.
    saved: 'Your {answer} {type} is in the Cloudinary DAM.',
    body: 'Now make it real at one of our stations.',
    stationsLabel: 'Our stations',
    // Carousel order: Everywhere first.
    stations: [
      {
        id: 'everywhere',
        name: 'Everywhere station',
        body: 'Write a page in WordPress, Shopify and more. Your assets find you, without leaving the page.',
      },
      {
        id: 'agent',
        name: 'Agent station',
        body: 'Pick Claude or ChatGPT, give it your name, and watch the agent build your magnet with Cloudinary.',
      },
    ],
    collect: 'Finish either one and collect your magnet + keychain at the counter.',
    ps: 'P.S. Keep an eye on the big screen. Your product might just show up.',
    startOver: 'Start over',
  },
};

export interface ProductInfo {
  label: string; // card title
  lower: string; // as used inside a sentence ("Your Truffle pizza")
  tagline: string;
  question: string;
  chips: string[];
  heroArt: string; // variant used for the welcome hero and the step 04 card
}

export const PRODUCTS: Record<ProductType, ProductInfo> = {
  pizza: {
    label: 'Pizza',
    lower: 'pizza',
    tagline: 'Wood-fired, obviously',
    question: 'Your topping?',
    chips: ['Burrata', 'Truffle', 'Pineapple', 'Olives', 'Artichoke'],
    heroArt: 'own-answer',
  },
  gelato: {
    label: 'Gelato',
    lower: 'gelato',
    tagline: 'One scoop is never enough',
    question: 'Your flavour?',
    chips: ['Pistachio', 'Stracciatella', 'Nocciola', 'Limone', 'Tiramisù'],
    heroArt: 'pistachio',
  },
  caffe: {
    label: 'Caffè',
    lower: 'caffè',
    tagline: 'Standing at the bar, like a local',
    question: 'How do you take it?',
    chips: ['Espresso', 'Cappuccino', 'Macchiato', 'Affogato', 'Ristretto'],
    heroArt: 'cappuccino',
  },
};

export const OWN_ANSWER = 'own-answer';
export const OWN_MAX = 18;

export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m));
}
