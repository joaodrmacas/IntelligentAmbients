// Preferences management
import { fetchFromAPI } from './api.js';

export function loadPreferences() {
    fetchFromAPI('/api/preferences')
        .then(data => {
            updatePreferencesUI(data);
        })
        .catch(error => {
            console.error('Error loading preferences:', error);
        });
}

function updatePreferencesUI(data) {
    // Update temperature slider
    document.getElementById('temp-preference').value = data.ideal_temp;
    document.getElementById('temp-value').textContent = data.ideal_temp + '°C';
    
    // Update light slider
    document.getElementById('light-preference').value = data.max_light;
    document.getElementById('light-value').textContent = data.max_light + '%';
    
    // Update checkboxes
    document.getElementById('auto-light').checked = data.adaptive_light;
    document.getElementById('auto-temp').checked = data.auto_temp;
    document.getElementById('sleep-notifications').checked = data.sleep_notifications;
    
    // Update sound duration
    document.getElementById('sound-duration').value = data.sound_duration;
    
    // Select the correct sound card
    const soundId = data.sound_id;
    document.querySelectorAll('.sound-card').forEach(card => {
        card.classList.remove('selected');
        if (card.getAttribute('data-sound-id') === soundId) {
            card.classList.add('selected');
        }
    });
}