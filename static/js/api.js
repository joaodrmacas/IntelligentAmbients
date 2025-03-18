
// Generic function to fetch data from API
export function fetchFromAPI(endpoint) {
    return fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            return response.json();
        });
}

// Function to save sound preferences
export function saveSoundPreferences(data) {
    console.log('Saving sound preferences:', data);
    
    return fetch('/api/preferences/sound', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            import('./dashboard.js').then(module => {
                module.showAlert('Sound preferences saved successfully!', 'success');
            });
            return response.json();
        } else {
            import('./dashboard.js').then(module => {
                module.showAlert('Failed to save sound preferences.', 'danger');
            });
            throw new Error('Failed to save sound preferences');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        import('./dashboard.js').then(module => {
            module.showAlert('Error saving preferences: ' + error.message, 'danger');
        });
        throw error;
    });
}

// Function to save environment preferences
export function saveEnvironmentPreferences(data) {
    console.log('Saving environment preferences:', data);
    
    return fetch('/api/preferences/environment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.ok) {
            import('./dashboard.js').then(module => {
                module.showAlert('Environment preferences saved successfully!', 'success');
            });
            return response.json();
        } else {
            import('./dashboard.js').then(module => {
                module.showAlert('Failed to save environment preferences.', 'danger');
            });
            throw new Error('Failed to save environment preferences');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        import('./dashboard.js').then(module => {
            module.showAlert('Error saving preferences: ' + error.message, 'danger');
        });
        throw error;
    });
}