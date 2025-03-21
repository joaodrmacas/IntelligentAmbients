// Dashboard initialization and updates
import { fetchFromAPI } from './api.js';
import { playSound } from './audio-player.js';

export function initDashboard() {
    fetchCurrentData();
    initSleepChart();
    populateSleepHistoryTable();
    
    // Update every 5 seconds
    setInterval(fetchCurrentData, 5000);
}

function fetchCurrentData() {
    fetchFromAPI('/api/current-data')
        .then(data => {
            updateDashboardStats(data);
            checkAndPlaySleepSounds(data);
        })
        .catch(error => {
            console.error('Error fetching sensor data:', error);
        });
}

// Check if it's time to play sleep sounds
function checkAndPlaySleepSounds(data) {
    // Only proceed if sleep notifications are enabled
    fetchFromAPI('/api/preferences')
        .then(preferences => {
            if (preferences.sleep_notifications) {
                fetchFromAPI('/api/optimal-conditions')
                    .then(conditions => {
                        // Play sound if conditions are optimal and user is in bed
                        if (conditions.overall_optimal && data.pressure >= 1) {
                            if (!window.audioPlayer) {
                                console.log('Playing sleep sound:', preferences.sound_id);
                                playSound(preferences.sound_id, preferences.sound_duration);
                                showAlert('Sleep conditions are optimal. Playing sleep sound.', 'info');
                            }
                        }
                    });
            }
        });
}

// Update dashboard statistics with current data
function updateDashboardStats(data) {
    // For demo purposes, using mock data if API data isn't available
    const dataToDisplay = {
        temperature: data.temperature || 20.5,
        light: data.light || 45,
        pressure: data.pressure || 0,
        timestamp: data.timestamp || new Date().toISOString()
    };

    updateTemperatureDisplay(dataToDisplay.temperature);
    updateLightDisplay(dataToDisplay.light);
    updateSleepStatus(dataToDisplay.pressure);
    updateEnvironmentStatus(dataToDisplay.temperature, dataToDisplay.light);
    updateEnvironmentControls(dataToDisplay.temperature, dataToDisplay.light);
}

function updateTemperatureDisplay(temp) {
    const tempElement = document.getElementById('temperature');
    tempElement.textContent = `${temp.toFixed(1)}°C`;

    if (temp < 17) {
        tempElement.innerHTML += ' <span class="badge bg-primary">Too Cold</span>';
    } else if (temp > 24) {
        tempElement.innerHTML += ' <span class="badge bg-danger">Too Hot</span>';
    } else {
        tempElement.innerHTML += ' <span class="badge bg-success">Optimal</span>';
    }
}

function updateLightDisplay(light) {
    const lightElement = document.getElementById('light-level');
    lightElement.textContent = `${light.toFixed(0)}%`;

    if (light > 30) {
        lightElement.innerHTML += ' <span class="badge bg-warning">Too Bright</span>';
    } else if (light < 5) {
        lightElement.innerHTML += ' <span class="badge bg-primary">Very Dark</span>';
    } else {
        lightElement.innerHTML += ' <span class="badge bg-success">Optimal</span>';
    }
}

function updateSleepStatus(pressure) {
    const sleepElement = document.getElementById('sleep-status');

    if (pressure > 0) {
        sleepElement.innerHTML = 'In Bed <span class="badge badge-sleep">Sleeping</span>';
    } else {
        sleepElement.innerHTML = 'Not in Bed <span class="badge bg-secondary">Awake</span>';
    }
}

export function updateEnvironmentStatus(temp, light) {
    const envElement = document.getElementById('environment-status');
    
    // Determine overall environment quality based on temperature and light
    if (temp >= 17 && temp <= 24 && light <= 30) {
        envElement.innerHTML = '<div class="status-indicator bg-success"></div> Optimal';
    } else if ((temp < 17 || temp > 24) && light > 30) {
        envElement.innerHTML = '<div class="status-indicator bg-danger"></div> Poor';
    } else {
        envElement.innerHTML = '<div class="status-indicator bg-warning"></div> Suboptimal';
    }
}

function updateEnvironmentControls(temp, light) {
    fetchFromAPI('/api/environment-control')
        .then(controlData => {
            createStatusElementsIfNeeded();
            updateTemperatureControlStatus(controlData);
            updateLightControlStatus(controlData);
        })
        .catch(error => {
            console.error('Error fetching environment control data:', error);
        });
}

function createStatusElementsIfNeeded() {
    // Create temperature control status element if it doesn't exist
    if (!document.getElementById('temp-control-status')) {
        const tempElement = document.getElementById('temperature').parentElement;
        const tempStatus = document.createElement('div');
        tempStatus.id = 'temp-control-status';
        tempStatus.className = 'mt-2 small';
        tempElement.appendChild(tempStatus);
    }
    
    // Create light control status element if it doesn't exist
    if (!document.getElementById('light-control-status')) {
        const lightElement = document.getElementById('light-level').parentElement;
        const lightStatus = document.createElement('div');
        lightStatus.id = 'light-control-status';
        lightStatus.className = 'mt-2 small';
        lightElement.appendChild(lightStatus);
    }
}

function updateTemperatureControlStatus(controlData) {
    const tempStatus = document.getElementById('temp-control-status');
    if (controlData.auto_temp) {
        tempStatus.innerHTML = getTemperatureStatusHTML(controlData.temp_adjust);
    } else {
        tempStatus.innerHTML = '<span class="text-muted">Auto-temperature disabled</span>';
    }
}

function updateLightControlStatus(controlData) {
    const lightStatus = document.getElementById('light-control-status');
    if (controlData.adaptive_light) {
        lightStatus.innerHTML = getLightStatusHTML(controlData.light_adjust);
    } else {
        lightStatus.innerHTML = '<span class="text-muted">Adaptive lighting disabled</span>';
    }
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
        return '<i class="fas fa-moon text-primary"></i> <span class="text-primary">Decreasing brightness</span>';
    } else {
        return '<i class="fas fa-check-circle text-success"></i> <span class="text-success">Light level maintained</span>';
    }
}

// Initialize sleep chart
function initSleepChart() {
    fetchFromAPI('/api/sleep-stats')
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
    fetchFromAPI('/api/sleep-history')
        .then(data => {
            updateSleepHistoryTable(data);
        })
        .catch(error => {
            console.error('Error fetching sleep history:', error);
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

        let hours = record.hours ? record.hours.toFixed(1) : 'N/A';
        let temp = record.temp ? record.temp.toFixed(1) : 'N/A';
        let light = record.light ? record.light.toFixed(1) : 'N/A';

        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${hours}</td>
            <td>${temp}°C</td>
            <td>${light}%</td>
            <td>${qualityBadge}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Helper function to show alerts
export function showAlert(message, type) {
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