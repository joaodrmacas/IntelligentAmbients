// UI control event handlers
import { playSound, stopSound } from './audio-player.js';
import { saveSoundPreferences, saveEnvironmentPreferences } from './api.js';
import { showAlert } from './dashboard.js';

export function initUIControls() {
    initSoundCardSelection();
    initSliders();
    initButtons();
}

function initSoundCardSelection() {
    document.querySelectorAll('.sound-card').forEach(card => {
        // Add selection functionality
        card.addEventListener('click', function() {
            document.querySelectorAll('.sound-card').forEach(c => {
                c.classList.remove('selected');
            });
            this.classList.add('selected');
            
            const soundId = this.getAttribute('data-sound-id');
            playSound(soundId, 5); // Play for 5 seconds as preview
        });
        
        // Create play button for each card
        const playButton = document.createElement('button');
        playButton.className = 'btn btn-sm btn-primary play-sound-btn';
        playButton.innerHTML = '<i class="fas fa-play"></i> Play';
        card.appendChild(playButton);
        
        // Add play functionality
        playButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card selection
            const soundId = card.getAttribute('data-sound-id');
            playSound(soundId, 5); // Play for 5 seconds as preview
        });
    });
}

function initSliders() {
    // Temperature slider value display
    document.getElementById('temp-preference').addEventListener('input', function() {
        document.getElementById('temp-value').textContent = this.value + '°C';
    });

    // Light slider value display
    document.getElementById('light-preference').addEventListener('input', function() {
        document.getElementById('light-value').textContent = this.value + '%';
    });
}

function initButtons() {
    // Save sound preferences
    document.getElementById('save-sound-preferences').addEventListener('click', function() {
        const selectedCard = document.querySelector('.sound-card.selected');
        const soundId = selectedCard ? selectedCard.getAttribute('data-sound-id') : null;
        const duration = document.getElementById('sound-duration').value;

        if (soundId) {
            const data = {
                soundId: soundId,
                duration: duration
            };
            saveSoundPreferences(data);
        } else {
            showAlert('Please select a sound.', 'warning');
        }
    });

    // Add test sound button if it doesn't exist
    if (!document.getElementById('test-sound')) {
        document.getElementById('save-sound-preferences').insertAdjacentHTML('beforebegin', `
            <button id="test-sound" class="btn btn-secondary me-2">
                <i class="fas fa-play"></i> Test Sound
            </button>
        `);
    }

    // Test sound button
    document.getElementById('test-sound').addEventListener('click', function() {
        const selectedCard = document.querySelector('.sound-card.selected');
        const soundId = selectedCard ? selectedCard.getAttribute('data-sound-id') : null;
        const duration = document.getElementById('sound-duration').value;
        
        if (soundId) {
            showAlert('Playing sound for ' + duration + ' seconds...', 'info');
            playSound(soundId);
        } else {
            showAlert('Please select a sound first.', 'warning');
        }
    });

    // Add stop button if it doesn't exist
    if (!document.getElementById('stop-sound')) {
        document.getElementById('test-sound').insertAdjacentHTML('afterend', `
            <button id="stop-sound" class="btn btn-danger me-2">
                <i class="fas fa-stop"></i> Stop
            </button>
        `);
    }

    // Stop sound button
    document.getElementById('stop-sound').addEventListener('click', function() {
        stopSound();
        showAlert('Sound stopped.', 'info');
    });

    // Save environment preferences
    document.getElementById('save-env-preferences').addEventListener('click', function() {
        const data = {
            idealTemp: document.getElementById('temp-preference').value,
            maxLight: document.getElementById('light-preference').value,
            adaptiveLight: document.getElementById('auto-light').checked,
            autoTemp: document.getElementById('auto-temp').checked,
            sleepNotifications: document.getElementById('sleep-notifications').checked
        };

        saveEnvironmentPreferences(data);
    });
}