import sqlite3
import random
from datetime import datetime, timedelta

# Add this function to handle datetime adaptation for SQLite
def adapt_datetime(dt):
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def populate_sleep_sessions():
    # Register the datetime adapter
    sqlite3.register_adapter(datetime, adapt_datetime)
    
    conn = sqlite3.connect("../smart_bedroom.db")
    cursor = conn.cursor()
    
    # Current date and time
    now = datetime.now()
    
    # Generate 14 days of sleep data (2 weeks of history)
    for day in range(14, 0, -1):
        # Calculate the date for this sleep session
        sleep_date = now - timedelta(days=day)
        
        # Random sleep start time between 9 PM and 12 AM
        sleep_hour = random.randint(21, 23)
        sleep_minute = random.randint(0, 59)
        sleep_start = sleep_date.replace(hour=sleep_hour, minute=sleep_minute, second=0, microsecond=0)
        
        # Random sleep duration between 4 and 9 hours
        sleep_duration = random.uniform(4, 9)
        sleep_end = sleep_start + timedelta(hours=sleep_duration)
        
        # Random temperature between 16 and 24°C
        avg_temp = random.uniform(14, 26)
        
        # Random light level between 0 and 40%
        avg_light = random.uniform(0, 60)
        
        quality = determine_sleep_quality(avg_temp, avg_light, sleep_duration * 60)
        
        # Insert the sleep session
        cursor.execute("""
            INSERT INTO sleep_sessions 
            (start_time, end_time, duration_minutes, avg_temperature, avg_light, quality)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            sleep_start.strftime("%Y-%m-%d %H:%M:%S"),
            sleep_end.strftime("%Y-%m-%d %H:%M:%S"),
            round(sleep_duration * 60),  # Convert hours to minutes
            round(avg_temp, 1),
            round(avg_light, 1),
            quality
        ))
    
    # Commit the changes
    conn.commit()
    
    # Populate some sensor data for the last 24 hours
    populate_sensor_data(conn, now)
    
    # Close the connection
    conn.close()
    
    print(f"Successfully populated {14} sleep sessions!")

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

def populate_sensor_data(conn, now):
    cursor = conn.cursor()
    
    # Generate data points for the last 24 hours
    for hour in range(24, 0, -1):
        timestamp = now - timedelta(hours=hour)
        
        # Normal values during day (6 AM - 10 PM)
        if 6 <= timestamp.hour < 22:
            temp = random.uniform(20, 25)  # Room temperature
            light = random.uniform(30, 90)  # Daylight
            pressure = random.randint(0, 1)  # Normally not in bed
        else:
            # Nighttime values
            temp = random.uniform(16, 22)  # Cooler at night
            light = random.uniform(0, 15)  # Dark at night
            pressure = random.randint(1, 5)  # In bed
        
        # Insert the sensor data
        cursor.execute("""
            INSERT INTO sensor_data 
            (temperature, light, pressure, timestamp)
            VALUES (?, ?, ?, ?)
        """, (
            round(temp, 1),
            round(light, 1),
            pressure,
            timestamp.strftime("%Y-%m-%d %H:%M:%S")
        ))
    
    # Add a few recent data points
    for minute in range(60, 0, -5):
        timestamp = now - timedelta(minutes=minute)
        temp = random.uniform(20, 23)
        light = random.uniform(40, 70)
        pressure = 0
        
        cursor.execute("""
            INSERT INTO sensor_data 
            (temperature, light, pressure, timestamp)
            VALUES (?, ?, ?, ?)
        """, (
            round(temp, 1),
            round(light, 1),
            pressure,
            timestamp.strftime("%Y-%m-%d %H:%M:%S")
        ))
    
    conn.commit()

def drop_database():
    # Register the datetime adapter
    sqlite3.register_adapter(datetime, adapt_datetime)
    
    conn = sqlite3.connect("../smart_bedroom.db")
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS sleep_sessions")
    cursor.execute("DROP TABLE IF EXISTS sensor_data")
    cursor.execute("CREATE TABLE sleep_sessions (id INTEGER PRIMARY KEY, start_time TEXT, end_time TEXT, duration_minutes INTEGER, avg_temperature REAL, avg_light REAL, quality TEXT)")
    cursor.execute("CREATE TABLE sensor_data (id INTEGER PRIMARY KEY, temperature REAL, light REAL, pressure INTEGER, timestamp TEXT)")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    drop_database()
    populate_sleep_sessions()