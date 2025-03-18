import { initNavigation } from './navigation.js';
import { initUIControls } from './ui-controls.js';
import { initDashboard } from './dashboard.js';
import { initAudioControls } from './audio-player.js';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initNavigation();
    initUIControls();
    initAudioControls();
    initDashboard();
});