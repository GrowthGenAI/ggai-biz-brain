export type Note = {
  id: string; // slug of the file name, e.g. "voice-dna"
  path: string; // path inside the vault, e.g. "Foundation/voice-dna.md"
  title: string;
  folder: string; // top folder, e.g. "Foundation", "Wiki", "Documents"
  content: string;
  links: string[]; // ids this note links to via [[wikilinks]]
};

export type Vault = {
  notes: Note[];
  uploadedAt: string;
  source?: string;
};

export type BrandKit = {
  founderName: string;
  brandName: string;
  role: string;
  handle: string;
  tagline: string;
  website: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: { heading: string; body: string };
  voice: string;
  neverSay: string;
  defaultCta: string;
  headshotUrl: string;
  logoUrl: string;
  updatedAt?: string;
};

export const EMPTY_BRAND: BrandKit = {
  founderName: '',
  brandName: '',
  role: '',
  handle: '',
  tagline: '',
  website: '',
  colors: {
    primary: '#1F2A44',
    secondary: '#F2B33D',
    accent: '#E8603C',
    background: '#FBF8F2',
    text: '#1B1B1B',
  },
  fonts: { heading: 'Playfair Display', body: 'Inter' },
  voice: '',
  neverSay: '',
  defaultCta: '',
  headshotUrl: '',
  logoUrl: '',
};

export type Kind = 'text' | 'carousel' | 'image' | 'newsletter' | 'reel' | 'video' | 'answer';

export type CarouselSlide = {
  kind: 'cover' | 'content' | 'cta';
  heading: string;
  body?: string;
  bullets?: string[];
  visual?: string; // description used if AI art is switched on
  imageUrl?: string;
};

export type Output = {
  id: string;
  kind: Kind;
  command: string;
  brief: string;
  playbook: string;
  title: string;
  createdAt: string;
  sources: string[];
  data: any;
};

export type HistoryItem = Pick<Output, 'id' | 'kind' | 'title' | 'createdAt' | 'command'>;
