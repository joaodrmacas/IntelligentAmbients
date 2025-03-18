from flask import Flask, request, jsonify, render_template, send_from_directory
import sqlite3
from datetime import datetime, timedelta
import os
from pytube import YouTube

app = Flask(__name__, static_folder='static')

# Database setup
def init_db():
    with sqlite3.connect("smart_bedroom.db") as conn:
        cursor = conn.cursor()
        
        # Create sensor data table
        cursor.execute('''CREATE TABLE IF NOT EXISTS sensor_data (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            temperature REAL,
                            light REAL,
                            pressure INTEGER,
                            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
        
        # Create sleep sessions table
        cursor.execute('''CREATE TABLE IF NOT EXISTS sleep_sessions (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            start_time DATETIME,
                            end_time DATETIME,
                            duration_minutes INTEGER,
                            avg_temperature REAL,
                            avg_light REAL,
                            quality TEXT)''')
        
        # Create user preferences table
        cursor.execute('''CREATE TABLE IF NOT EXISTS user_preferences (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            ideal_temp REAL DEFAULT 18.5,
                            max_light INTEGER DEFAULT 10,
                            adaptive_light BOOLEAN DEFAULT 1,
                            auto_temp BOOLEAN DEFAULT 1,
                            sleep_notifications BOOLEAN DEFAULT 1,
                            sound_id TEXT DEFAULT 'white-noise',
                            sound_duration INTEGER DEFAULT 30)''')
        
        # Insert default preferences if not exists
        cursor.execute("SELECT COUNT(*) FROM user_preferences")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO user_preferences DEFAULT VALUES")
        
        conn.commit()

init_db()

def insert_sensor_data(data):
    with sqlite3.connect("smart_bedroom.db") as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO sensor_data (temperature, light, pressure) VALUES (?, ?, ?)",
                       (data.get("temp"), data.get("light"), data.get("pressure")))
        conn.commit()
        
        # Check if we need to update sleep sessions
        update_sleep_sessions(conn, data)

@app.route("/sounds/<sound_id>.mp3")
def serve_sound(sound_id):
    sound_dir = "static/sounds"
    sound_path = os.path.join(sound_dir, f"{sound_id}.mp3")
    
    # Check if the sound file already exists
    if not os.path.exists(sound_path):
        # Create the sounds directory if it doesn't exist
        if not os.path.exists(sound_dir):
            os.makedirs(sound_dir)
        
        try:
            # Download the sound from YouTube
            yt = YouTube(f"https://www.youtube.com/watch?v={sound_id}")
            audio_stream = yt.streams.filter(only_audio=True).first()
            temp_file = audio_stream.download(output_path=sound_dir, filename=f"{sound_id}")
            
            # Convert to MP3 if needed (you might need pydub for this)
            # For simplicity, we'll just rename the file
            base, ext = os.path.splitext(temp_file)
            if ext != '.mp3':
                os.rename(temp_file, sound_path)
        except Exception as e:
            #TODO: code a personalized sound
            print(f"Error downloading sound: {e}")
            return "", 404
    
    return send_from_directory(sound_dir, f"{sound_id}.mp3")

def update_sleep_sessions(conn, data):
    cursor = conn.cursor()
    pressure = data.get("pressure", 0)
    
    # Get the last sleep session that doesn't have an end time
    cursor.execute("SELECT id, start_time FROM sleep_sessions WHERE end_time IS NULL")
    active_session = cursor.fetchone()
    
    # User is in bed
    if pressure > 1:
        if not active_session:
            cursor.execute("INSERT INTO sleep_sessions (start_time) VALUES (?)", 
                          (datetime.now().strftime("%Y-%m-%d %H:%M:%S"),))
            conn.commit()
    else:  # User is not in bed
        if active_session:
            # End the active sleep session
            session_id, start_time = active_session
            end_time = datetime.now()
            start_time = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
            
            # Calculate duration in minutes
            duration = (end_time - start_time).total_seconds() / 60
            
            # Calculate averages for this session
            cursor.execute("""
                SELECT AVG(temperature), AVG(light) FROM sensor_data 
                WHERE timestamp BETWEEN ? AND ?
            """, (start_time, end_time))
            
            avg_temp, avg_light = cursor.fetchone()
            
            # Determine sleep quality
            if avg_temp is not None and avg_light is not None:
                quality = determine_sleep_quality(avg_temp, avg_light, duration)
            else:
                quality = "Unknown"
            
            # Update the session
            cursor.execute("""
                UPDATE sleep_sessions 
                SET end_time = ?, duration_minutes = ?, avg_temperature = ?, avg_light = ?, quality = ?
                WHERE id = ?
            """, (end_time.strftime("%Y-%m-%d %H:%M:%S"), round(duration), avg_temp, avg_light, quality, session_id))
            
            conn.commit()

def determine_sleep_quality(avg_temp, avg_light, duration):
    quality_score = 0
    
    # Temperature factor (18-22°C is ideal)
    if 18 <= avg_temp <= 22:
        quality_score += 3
    elif 16 <= avg_temp < 18 or 22 < avg_temp <= 24:
        quality_score += 2
    else:
        quality_score += 1
    
    # Light factor (0-15% is ideal)
    if 0 <= avg_light <= 15:
        quality_score += 3
    elif 15 < avg_light <= 30:
        quality_score += 2
    else:
        quality_score += 1
    
    # Duration factor (7-9 hours is ideal)
    duration_hours = duration / 60
    if 7 <= duration_hours <= 9:
        quality_score += 3
    elif 6 <= duration_hours < 7 or 9 < duration_hours <= 10:
        quality_score += 2
    else:
        quality_score += 1
    
    # Convert score to quality
    if quality_score >= 8:
        return "Excellent"
    elif quality_score >= 6:
        return "Good"
    elif quality_score >= 4:
        return "Fair"
    else:
        return "Poor"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)

@app.route("/api/sensor-data", methods=["POST"])
def receive_sensor_data():
    """Receives and stores sensor data from the Arduino script."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid data"}), 400
    
    insert_sensor_data(data)
    print(f"Received sensor data: {data}")
    return jsonify({"message": "Data received successfully"}), 200

@app.route("/api/current-data", methods=["GET"])
def get_current_data():
    """Returns the latest sensor data and sleep status."""
    with sqlite3.connect("smart_bedroom.db") as conn:
        cursor = conn.cursor()
        
        # Get latest sensor data
        cursor.execute("SELECT temperature, light, pressure, timestamp FROM sensor_data ORDER BY id DESC LIMIT 1")
        sensor_row = cursor.fetchone()
        
        # Get active sleep session if any
        cursor.execute("SELECT start_time FROM sleep_sessions WHERE end_time IS NULL")
        active_session = cursor.fetchone()
        
        if sensor_row:
            data = {
                "temperature": sensor_row[0],
                "light": sensor_row[1],
                "pressure": sensor_row[2],
                "timestamp": sensor_row[3],
                "sleeping": active_session is not None
            }
            
            # If sleeping, calculate current duration
            if active_session:
                start_time = datetime.strptime(active_session[0], "%Y-%m-%d %H:%M:%S")
                current_duration = (datetime.now() - start_time).total_seconds() / 60
                data["current_sleep_duration"] = round(current_duration)
                
            return jsonify(data)
        
        return jsonify({"message": "No data available"})

@app.route("/api/sleep-history", methods=["GET"])
def get_sleep_history():
    """Returns sleep history for the past 7 days."""
    days = request.args.get('days', 7, type=int)
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    with sqlite3.connect("smart_bedroom.db") as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                start_time, 
                end_time, 
                duration_minutes, 
                avg_temperature, 
                avg_light, 
                quality 
            FROM sleep_sessions 
            WHERE start_time >= ? AND end_time IS NOT NULL
            ORDER BY start_time DESC
        """, (start_date,))
        
        rows = cursor.fetchall()
        history = []
        
        for row in rows:
            start_time = datetime.strptime(row[0], "%Y-%m-%d %H:%M:%S")
            end_time = datetime.strptime(row[1], "%Y-%m-%d %H:%M:%S")
            
            history.append({
                "date": start_time.strftime("%Y-%m-%d"),
                "start_time": start_time.strftime("%H:%M"),
                "end_time": end_time.strftime("%H:%M"),
                "hours": round(row[2] / 60, 1),
                "temp": row[3],
                "light": row[4],
                "quality": row[5]
            })
        
        return jsonify(history)

@app.route("/api/sleep-stats", methods=["GET"])
def get_sleep_stats():
    with sqlite3.connect("smart_bedroom.db") as conn:
        cursor = conn.cursor()
        
        # Get daily averages for the past 7 days
        cursor.execute("""
            SELECT 
                strftime('%Y-%m-%d', start_time) as date,
                SUM(duration_minutes) / 60.0 as total_hours,
                AVG(avg_temperature) as avg_temp,
                AVG(avg_light) as avg_light
            FROM sleep_sessions 
            WHERE start_time >= date('now', '-7 days') AND end_time IS NOT NULL
            GROUP BY date
            ORDER BY date
        """)
        
        daily_rows = cursor.fetchall()
        daily_stats = []
        
        for row in daily_rows:
            daily_stats.append({
                "date": row[0],
                "hours": round(row[1], 1),
                "temp": round(row[2], 1) if row[2] else None,
                "light": round(row[3], 1) if row[3] else None
            })
        
        # Get weekly averages
        cursor.execute("""
            SELECT 
                AVG(duration_minutes) / 60.0 as avg_hours,
                AVG(avg_temperature) as avg_temp,
                AVG(avg_light) as avg_light,
                COUNT(*) as session_count
            FROM sleep_sessions 
            WHERE start_time >= date('now', '-7 days') AND end_time IS NOT NULL
        """)
        
        weekly_row = cursor.fetchone()
        weekly_stats = {
            "avg_hours": round(weekly_row[0], 1) if weekly_row[0] else 0,
            "avg_temp": round(weekly_row[1], 1) if weekly_row[1] else 0,
            "avg_light": round(weekly_row[2], 1) if weekly_row[2] else 0,
            "session_count": weekly_row[3]
        }
        
        return jsonify({
            "daily": daily_stats,
            "weekly": weekly_stats
        })

@app.route("/api/preferences", methods=["GET"])
def get_preferences():
    with sqlite3.connect("smart_bedroom.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_preferences ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        
        if row:
            return jsonify({
                "ideal_temp": row[1],
                "max_light": row[2],
                "adaptive_light": bool(row[3]),
                "auto_temp": bool(row[4]),
                "sleep_notifications": bool(row[5]),
                "sound_id": row[6],
                "sound_duration": row[7]
            })
        
        return jsonify({"message": "No preferences found"})

@app.route("/api/preferences/sound", methods=["POST"])
def save_sound_preferences():
    """Saves sound preferences."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid data"}), 400
    
    with sqlite3.connect("smart_bedroom.db") as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE user_preferences 
            SET sound_id = ?, sound_duration = ?
            WHERE id = (SELECT id FROM user_preferences ORDER BY id DESC LIMIT 1)
        """, (data.get("soundId"), data.get("duration")))
        conn.commit()
    
    return jsonify({"message": "Sound preferences saved successfully"})

@app.route("/api/preferences/environment", methods=["POST"])
def save_environment_preferences():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid data"}), 400
    
    with sqlite3.connect("smart_bedroom.db") as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE user_preferences 
            SET ideal_temp = ?, max_light = ?, adaptive_light = ?, auto_temp = ?, sleep_notifications = ?
            WHERE id = (SELECT id FROM user_preferences ORDER BY id DESC LIMIT 1)
        """, (
            data.get("idealTemp"), 
            data.get("maxLight"), 
            1 if data.get("adaptiveLight") else 0, 
            1 if data.get("autoTemp") else 0, 
            1 if data.get("sleepNotifications") else 0
        ))
        conn.commit()
    
    return jsonify({"message": "Environment preferences saved successfully"})

@app.route("/api/optimal-conditions", methods=["GET"])
def get_optimal_conditions():
    with sqlite3.connect("smart_bedroom.db") as conn:
        cursor = conn.cursor()
        
        # Get latest sensor data
        cursor.execute("SELECT temperature, light FROM sensor_data ORDER BY id DESC LIMIT 1")
        sensor_row = cursor.fetchone()
        
        # Get user preferences
        cursor.execute("SELECT ideal_temp, max_light FROM user_preferences ORDER BY id DESC LIMIT 1")
        pref_row = cursor.fetchone()
        
        if sensor_row and pref_row:
            temp = sensor_row[0]
            light = sensor_row[1]
            ideal_temp = pref_row[0]
            max_light = pref_row[1]
            
            temp_optimal = (ideal_temp - 2) <= temp <= (ideal_temp + 2)
            light_optimal = light <= max_light
            
            return jsonify({
                "temperature_optimal": temp_optimal,
                "light_optimal": light_optimal,
                "overall_optimal": temp_optimal and light_optimal
            })
        
        return jsonify({"message": "Insufficient data to determine optimal conditions"})

if __name__ == "__main__":
    for directory in ["templates", "static"]:
        if not os.path.exists(directory):
            os.makedirs(directory)
    
    app.run(debug=True)