import { loadPreferences } from './preferences.js';

export function initNavigation() {
    document.getElementById('dashboard-link').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('dashboard-section').style.display = 'block';
        document.getElementById('settings-section').style.display = 'none';
        document.getElementById('dashboard-link').classList.add('active');
        document.getElementById('settings-link').classList.remove('active');
    });

    document.getElementById('settings-link').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('dashboard-section').style.display = 'none';
        document.getElementById('settings-section').style.display = 'block';
        document.getElementById('dashboard-link').classList.remove('active');
        document.getElementById('settings-link').classList.add('active');

        loadPreferences();
    });
}