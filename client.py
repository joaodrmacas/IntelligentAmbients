import serial
import requests
import time

SERIAL_PORT = "/dev/ttyACM0" 
BAUD_RATE = 9600
FLASK_API_URL = "http://127.0.0.1:5000/api/sensor-data"
PREFERENCES_API_URL = "http://127.0.0.1:5000/api/preferences"

def parse_data(data):
    try:
        data_dict = {}
        pairs = data.strip().split(",")
        for pair in pairs:
            key, value = pair.split(":")
            data_dict[key] = float(value)
        return data_dict
    except Exception as e:
        print(f"Error parsing data: {e}")
        return None

def send_to_flask(data):
    try:
        response = requests.post(FLASK_API_URL, json=data)
        print(f"Sent data: {data}, Response: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error sending data to Flask: {e}")

def get_user_preferences():
    try:
        response = requests.get(PREFERENCES_API_URL)
        if response.status_code == 200:
            prefs = response.json()
            print(f"Got user preferences: {prefs}")
            return prefs
        else:
            print(f"Error getting user preferences: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to preferences API: {e}")
        return None

def send_preferences_to_arduino(ser, prefs):
    if not prefs:
        return False
    
    try:
        # Format: "PREFS:ideal_temp,max_light,adaptive_light,auto_temp"
        # Where adaptive_light and auto_temp are 1 (true) or 0 (false)
        adaptive_light = 1 if prefs.get("adaptive_light", False) else 0
        auto_temp = 1 if prefs.get("auto_temp", False) else 0
        
        command_str = f"PREFS:{prefs.get('ideal_temp', 18.5)},{prefs.get('max_light', 10)},{adaptive_light},{auto_temp}\n"
        
        print(f"Sending preferences to Arduino: {command_str.strip()}")
        ser.write(command_str.encode())
        
        return False
    
    except Exception as e:
        print(f"Error sending preferences to Arduino: {e}")
        return False


if __name__ == "__main__":
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        time.sleep(2)
        print("Connected to Arduino. Starting communication...")
        
        last_prefs_check = 0
        prefs_check_interval = 10 

        prefs = get_user_preferences()
        if prefs:
            send_preferences_to_arduino(ser, prefs)
        else:
            print("No preferences found. Skipping sending to Arduino.")
        
        while True:
            # Read data from Arduino
            raw_data = ser.readline().decode("utf-8").strip()
            if raw_data:
                print(f"Received: {raw_data}")
                
                # Check if it's a data line (not a control acknowledgment)
                if raw_data.startswith("temp:") or raw_data.startswith("light:") or raw_data.startswith("pressure:"):
                    parsed_data = parse_data(raw_data)
                    if parsed_data:
                        send_to_flask(parsed_data)

            current_time = time.time()
            if current_time - last_prefs_check >= prefs_check_interval:
                prefs = get_user_preferences()
                if prefs:
                    send_preferences_to_arduino(ser, prefs)
                else:
                    print("No preferences found. Skipping sending to Arduino.")
                last_prefs_check = current_time     
            
            time.sleep(1)


    except serial.SerialException as e:
        print(f"Serial connection error: {e}")