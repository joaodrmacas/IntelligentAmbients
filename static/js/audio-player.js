let audioPlayer = null;
let soundTimer = null;

export function stopSound() {
    // Clear any existing timer
    if (soundTimer) {
        clearTimeout(soundTimer);
        soundTimer = null;
    }
    
    // Stop any playing audio
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
        audioPlayer = null;
        console.log('Sound stopped');
    }
}

export function playSound(soundId, customDuration = null) {
    // Stop any currently playing sound
    stopSound();
    
    const soundUrl = `/sounds/${soundId}.mp3`;
    
    // Create new audio player
    audioPlayer = new Audio(soundUrl);
    
    // Make it accessible globally for checking play status
    window.audioPlayer = audioPlayer;
    
    // Add error handling
    audioPlayer.onerror = function() {
        console.error('Error playing sound:', soundId);
        import('./dashboard.js').then(module => {
            //module.showAlert('Error playing sound. File may not exist.', 'danger');
        });
    };
    
    // For sleep sounds, add special handling
    audioPlayer.loop = window.sleepModeEnabled ? true : false;
    
    // Play the sound
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                console.log('Playing sound:', soundId);
                
                // Only set a timer if not in sleep mode or custom duration is small
                if (!window.sleepModeEnabled || (customDuration && customDuration < 30)) {
                    // Get duration from parameter or from input field
                    let duration;
                    if (customDuration !== null) {
                        duration = customDuration * 1000;
                    } else {
                        const durationElement = document.getElementById('sound-duration');
                        duration = durationElement ? durationElement.value * 1000 : 5000; // Default to 5 seconds
                    }
                    
                    // Set a timer to stop the sound after the specified duration
                    soundTimer = setTimeout(() => {
                        stopSound();
                    }, duration);
                }
            })
            .catch(error => {
                console.error('Error playing sound:', error);
                import('./dashboard.js').then(module => {
                    module.showAlert('Error playing sound: ' + error.message, 'danger');
                });
            });
    }
}