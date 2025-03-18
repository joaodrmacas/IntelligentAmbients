import { initNavigation } from './navigation.js';
import { initUIControls } from './ui-controls.js';
import { initDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initUIControls();
    initDashboard();
});