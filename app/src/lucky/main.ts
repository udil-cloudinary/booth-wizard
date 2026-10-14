import '../styles.css';
import './lucky.css';
import { config } from '../config';
import { fromUrlOrSession } from '../prefs';
import { mount } from './app';
import topics from './topics.json';
import type { TopicsFile } from './types';

document.documentElement.dataset.theme = fromUrlOrSession('theme', ['yellow', 'blue'], config.theme);
mount(document.getElementById('app')!, topics as TopicsFile);
