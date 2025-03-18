// Navigation between sections
document.getElementById('dashboard-link').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('dashboard-section').style.display = 'block';
    document.getElementById('settings-section').style.display = 'none';
    document.getElementById('dashboard-link').classList.add('active');
    document.getElementById('settings-link').classList.remove('active');
});

document.getElementById('settings-link').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('settings-section').style.display = 'block';
    document.getElementById('dashboard-link').classList.remove('active');
    document.getElementById('settings-link').classList.add('active');

    loadPreferences();
});

// Sound card selection
document.querySelectorAll('.sound-card').forEach(card => {
    card.addEventListener('click', function () {
        // Remove selected class from all cards
        document.querySelectorAll('.sound-card').forEach(c => {
            c.classList.remove('selected');
        });
        // Add selected class to clicked card
        this.classList.add('selected');
    });
});

// Custom YouTube ID handler
document.getElementById('set-custom-sound').addEventListener('click', function () {
    const customId = document.getElementById('custom-youtube-id').value.trim();
    if (customId) {
        const customCard = document.querySelector('.sound-card[data-sound-id="custom"]') ||
            document.querySelector('.sound-card:last-child');
        customCard.setAttribute('data-sound-id', customId);

        // Remove selected class from all cards
        document.querySelectorAll('.sound-card').forEach(c => {
            c.classList.remove('selected');
        });
        // Add selected class to custom card
        customCard.classList.add('selected');
    }
});

// Temperature slider value display
document.getElementById('temp-preference').addEventListener('input', function () {
    document.getElementById('temp-value').textContent = this.value + '°C';
});

// Light slider value display
document.getElementById('light-preference').addEventListener('input', function () {
    document.getElementById('light-value').textContent = this.value + '%';
});

// Save preferences
document.getElementById('save-sound-preferences').addEventListener('click', function () {
    const selectedCard = document.querySelector('.sound-card.selected');
    const soundId = selectedCard ? selectedCard.getAttribute('data-sound-id') : null;
    const duration = document.getElementById('sound-duration').value;

    if (soundId) {
        const data = {
            soundId: soundId,
            duration: duration
        };

        // Send data to backend
        saveSoundPreferences(data);
    } else {
        alert('Please select a sound.');
    }
});

// Add a test sound button
document.getElementById('save-sound-preferences').insertAdjacentHTML('beforebegin', `
    <button id="test-sound" class="btn btn-secondary me-2">
        <i class="fas fa-play"></i> Test Sound
    </button>
`);

// Add event listener for the test sound button
document.getElementById('test-sound').addEventListener('click', function() {
    const selectedCard = document.querySelector('.sound-card.selected');
    const soundId = selectedCard ? selectedCard.getAttribute('data-sound-id') : null;
    const duration = document.getElementById('sound-duration').value;
    
    if (soundId) {
        showAlert('Playing sound for ' + duration + ' seconds...', 'info');
        playSound(soundId); // Use the duration from the input field
    } else {
        showAlert('Please select a sound first.', 'warning');
    }
});

// Add a stop button
document.getElementById('test-sound').insertAdjacentHTML('afterend', `
    <button id="stop-sound" class="btn btn-danger me-2">
        <i class="fas fa-stop"></i> Stop
    </button>
`);

document.getElementById('stop-sound').addEventListener('click', function() {
    stopSound();
    showAlert('Sound stopped.', 'info');
});

document.getElementById('save-env-preferences').addEventListener('click', function () {
    const data = {
        idealTemp: document.getElementById('temp-preference').value,
        maxLight: document.getElementById('light-preference').value,
        adaptiveLight: document.getElementById('auto-light').checked,
        autoTemp: document.getElementById('auto-temp').checked,
        sleepNotifications: document.getElementById('sleep-notifications').checked
    };

    // Send data to backend
    saveEnvironmentPreferences(data);
});

let audioPlayer = null;
let soundTimer = null;

// Check if it's time to play sleep sounds
function checkAndPlaySleepSounds(data) {
    // Only proceed if sleep notifications are enabled
    fetch('/api/preferences')
        .then(response => response.json())
        .then(preferences => {
            if (preferences.sleep_notifications) {
                fetch('/api/optimal-conditions')
                    .then(response => response.json())
                    .then(conditions => {
                        // Play sound if conditions are optimal and user is in bed
                        if (conditions.overall_optimal && data.pressure > 10) {
                            // Play the selected sound
                            const soundId = preferences.sound_id;
                            const duration = preferences.sound_duration;
                            
                            // Don't play if already playing
                            if (!audioPlayer) {
                                console.log('Playing sleep sound:', soundId);
                                playSound(soundId);
                                showAlert('Sleep conditions are optimal. Playing sleep sound.', 'info');
                            }
                        }
                    });
            }
        });
}

function saveSoundPreferences(data) {
    console.log('Saving sound preferences:', data);
    // Mock API call
    fetch('/api/preferences/sound', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (response.ok) {
                showAlert('Sound preferences saved successfully!', 'success');
            } else {
                showAlert('Failed to save sound preferences.', 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Error saving preferences: ' + error.message, 'danger');
        });
}

function updateEnvironmentControls(temp, light, data) {
    // Get control status
    fetch('/api/environment-control')
        .then(response => response.json())
        .then(controlData => {
            // Update temperature status
            const tempStatusElement = document.getElementById('temp-control-status');
            if (!tempStatusElement) {
                // Create temperature control status element if it doesn't exist
                const tempElement = document.getElementById('temperature').parentElement;
                const tempStatus = document.createElement('div');
                tempStatus.id = 'temp-control-status';
                tempStatus.className = 'mt-2 small';
                tempElement.appendChild(tempStatus);
            }
            
            // Update light control status
            const lightStatusElement = document.getElementById('light-control-status');
            if (!lightStatusElement) {
                // Create light control status element if it doesn't exist
                const lightElement = document.getElementById('light-level').parentElement;
                const lightStatus = document.createElement('div');
                lightStatus.id = 'light-control-status';
                lightStatus.className = 'mt-2 small';
                lightElement.appendChild(lightStatus);
            }
            
            // Set status text based on adjustments
            if (controlData.auto_temp) {
                document.getElementById('temp-control-status').innerHTML = getTemperatureStatusHTML(controlData.temp_adjust);
            } else {
                document.getElementById('temp-control-status').innerHTML = '<span class="text-muted">Auto-temperature disabled</span>';
            }
            
            if (controlData.adaptive_light) {
                document.getElementById('light-control-status').innerHTML = getLightStatusHTML(controlData.light_adjust);
            } else {
                document.getElementById('light-control-status').innerHTML = '<span class="text-muted">Adaptive lighting disabled</span>';
            }
        })
        .catch(error => {
            console.error('Error fetching environment control data:', error);
        });
}

function getTemperatureStatusHTML(tempAdjust) {
    if (tempAdjust > 0) {
        return '<i class="fas fa-fire text-danger"></i> <span class="text-danger">Heating active</span>';
    } else if (tempAdjust < 0) {
        return '<i class="fas fa-snowflake text-primary"></i> <span class="text-primary">Cooling active</span>';
    } else {
        return '<i class="fas fa-check-circle text-success"></i> <span class="text-success">Temperature maintained</span>';
    }
}

function getLightStatusHTML(lightAdjust) {
    if (lightAdjust > 0) {
        return '<i class="fas fa-sun text-warning"></i> <span class="text-warning">Increasing brightness</span>';
    } else if (lightAdjust < 0) {
        return '<i class="fas fa-moon text-primary"></i> <span class="text-primary">Dimming lights</span>';
    } else {
        return '<i class="fas fa-check-circle text-success"></i> <span class="text-success">Light level maintained</span>';
    }
}


function saveEnvironmentPreferences(data) {
    console.log('Saving environment preferences:', data);
    // Mock API call
    fetch('/api/preferences/environment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (response.ok) {
                showAlert('Environment preferences saved successfully!', 'success');
            } else {
                showAlert('Failed to save environment preferences.', 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Error saving preferences: ' + error.message, 'danger');
        });
}

// Helper function to show alerts
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed bottom-0 end-0 m-3`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);

    // Auto-close after 3 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 3000);
}

// Initialize dashboard data and charts
function initDashboard() {
    // Fetch current sensor data
    fetchCurrentData();

    initSleepChart();

    populateSleepHistoryTable();

    setInterval(fetchCurrentData, 5000); // Update every 5 seconds
}

function updateEnvironmentStatus(temp, light) {
    const envElement = document.getElementById('environment-status');
    
    // Determine overall environment quality based on temperature and light
    if (temp >= 17 && temp <= 24 && light <= 30) {
        envElement.innerHTML = '<div class="status-indicator bg-success"></div> Optimal';
        // envElement.className = 'optimal';
    } else if ((temp < 17 || temp > 24) && light > 30) {
        envElement.innerHTML = '<div class="status-indicator bg-danger"></div> Poor';
        // envElement.className = 'poor';
    } else {
        envElement.innerHTML = '<div class="status-indicator bg-warning"></div> Suboptimal';
        // envElement.className = 'suboptimal';
    }
}


function fetchCurrentData() {
    fetch('/api/current-data')
        .then(response => response.json())
        .then(data => {
            updateDashboardStats(data);

            checkAndPlaySleepSounds(data);
        })
        .catch(error => {
            console.error('Error fetching sensor data:', error);
        });
}

// Update dashboard statistics with current data
function updateDashboardStats(data) {
    // For demo purposes, using mock data if API data isn't available
    const mockData = {
        temperature: data.temperature || 20.5,
        light: data.light || 45,
        pressure: data.pressure || 0,
        timestamp: data.timestamp || new Date().toISOString()
    };

    // Update temperature display
    const tempElement = document.getElementById('temperature');
    const temp = mockData.temperature;
    tempElement.textContent = `${temp.toFixed(1)}°C`;

    if (temp < 17) {
        tempElement.innerHTML += ' <span class="badge bg-primary">Too Cold</span>';
    } else if (temp > 24) {
        tempElement.innerHTML += ' <span class="badge bg-danger">Too Hot</span>';
    } else {
        tempElement.innerHTML += ' <span class="badge bg-success">Optimal</span>';
    }

    // Update light level display
    const lightElement = document.getElementById('light-level');
    const light = mockData.light;
    lightElement.textContent = `${light.toFixed(0)}%`;

    if (light > 30) {
        lightElement.innerHTML += ' <span class="badge bg-warning">Too Bright</span>';
    } else if (light < 5) {
        lightElement.innerHTML += ' <span class="badge bg-primary">Very Dark</span>';
    } else {
        lightElement.innerHTML += ' <span class="badge bg-success">Optimal</span>';
    }

    // Update sleep status
    const sleepElement = document.getElementById('sleep-status');
    const pressure = mockData.pressure;

    if (pressure > 10) {
        sleepElement.innerHTML = 'In Bed <span class="badge badge-sleep">Sleeping</span>';
    } else {
        sleepElement.innerHTML = 'Not in Bed <span class="badge bg-secondary">Awake</span>';
    }

    // Update environment status
    const envElement = document.getElementById('environment-status');

    // Determine overall environment quality based on temperature and light
    if (temp >= 17 && temp <= 24 && light <= 30) {
        envElement.innerHTML = '<div class="status-indicator bg-success"></div> Optimal';
        // envElement.className = 'optimal';
    } else if ((temp < 17 || temp > 24) && light > 30) {
        envElement.innerHTML = '<div class="status-indicator bg-danger"></div> Poor';
        // envElement.className = 'poor';
    } else {
        envElement.innerHTML = '<div class="status-indicator bg-warning"></div> Suboptimal';
        // envElement.className = 'suboptimal';
    }

    updateEnvironmentStatus(temp, light);
    updateEnvironmentControls(data.temperature, data.light);
}

// Initialize sleep chart
function initSleepChart() {
    fetch('/api/sleep-stats')
    .then(response => response.json())
    .then(data => {
        const dailyData = data.daily;
        
        const labels = dailyData.map(day => {
            const date = new Date(day.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });
        
        const sleepHours = dailyData.map(day => day.hours);
        
        const ctx = document.getElementById('sleepChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sleep Hours',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    data: sleepHours,
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    })
    .catch(error => {
        console.error('Error fetching sleep stats:', error);
    });
}

function populateSleepHistoryTable() {
    fetch('/api/sleep-history')
        .then(response => {
            if (!response.ok) {
                throw new Error('API not available');
            }
            return response.json();
        })
        .then(data => {
            updateSleepHistoryTable(data);
        })
        .catch(error => {
            console.error('Error fetching sleep history:', error);
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

function updateSleepHistoryTable(data) {
    const tableBody = document.getElementById('sleep-history-table');
    tableBody.innerHTML = '';

    data.forEach(record => {
        const row = document.createElement('tr');

        // Format date
        const date = new Date(record.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        // Create badge for quality
        let qualityBadge;
        switch (record.quality) {
            case 'Excellent':
                qualityBadge = '<span class="badge bg-success">Excellent</span>';
                break;
            case 'Good':
                qualityBadge = '<span class="badge bg-info">Good</span>';
                break;
            case 'Fair':
                qualityBadge = '<span class="badge bg-warning">Fair</span>';
                break;
            case 'Poor':
                qualityBadge = '<span class="badge bg-danger">Poor</span>';
                break;
            default:
                qualityBadge = '<span class="badge bg-secondary">Unknown</span>';
        }

        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${record.hours.toFixed(1)}</td>
            <td>${record.temp.toFixed(1)}°C</td>
            <td>${record.light}%</td>
            <td>${qualityBadge}</td>
        `;

        tableBody.appendChild(row);
    });
}

function stopSound() {
    // Clear any existing timer
    if (soundTimer) {
        clearTimeout(soundTimer);
        soundTimer = null;
    }
    
    // Stop any playing audio
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer = null;
        console.log('Sound stopped');
    }
}

function playSound(soundId, customDuration = null) {
    // Stop any currently playing sound
    stopSound();
    
    const soundUrl = `/sounds/${soundId}.mp3`;
    
    // Create new audio player
    audioPlayer = new Audio(soundUrl);
    
    // Add error handling
    audioPlayer.onerror = function() {
        console.error('Error playing sound:', soundId);
        showAlert('Error playing sound. File may not exist.', 'danger');
    };
    
    // Play the sound
    audioPlayer.play()
        .then(() => {
            console.log('Playing sound:', soundId);
            
            // Get duration from parameter or from input field
            const duration = customDuration !== null ? 
                customDuration * 1000 : 
                document.getElementById('sound-duration').value * 1000;
            
            // Set a timer to stop the sound after the specified duration
            soundTimer = setTimeout(() => {
                stopSound();
            }, duration);
        })
        .catch(error => {
            console.error('Error playing sound:', error);
            showAlert('Error playing sound: ' + error.message, 'danger');
        });
}

// Add play button to each sound card
document.querySelectorAll('.sound-card').forEach(card => {
    // Create play button
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

document.querySelectorAll('.sound-card').forEach(card => {
    card.addEventListener('click', function() {
        document.querySelectorAll('.sound-card').forEach(c => {
            c.classList.remove('selected');
        });
        this.classList.add('selected');
        
        const soundId = this.getAttribute('data-sound-id');
        playSound(soundId, 5);
    });
});

function loadPreferences() {
    fetch('/api/preferences')
        .then(response => {
            if (!response.ok) {
                throw new Error('API not available');
            }
            return response.json();
        })
        .then(data => {
            updatePreferencesUI(data);
        })
        .catch(error => {
            console.error('Error loading preferences:', error);
        });
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', function () {
    initDashboard();
});