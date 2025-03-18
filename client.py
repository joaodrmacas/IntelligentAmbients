import serial
import requests
import time

SERIAL_PORT = "COM3" 
BAUD_RATE = 9600
FLASK_API_URL = "http://127.0.0.1:5000/sensor-data"
CONTROL_API_URL = "http://127.0.0.1:5000/api/environment-control"

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

def get_control_commands():
    try:
        response = requests.get(CONTROL_API_URL)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error getting control commands: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to control API: {e}")
        return None
    
def send_commands_to_arduino(ser, commands):
    if not commands:
        return
    
    if commands["auto_temp"] or commands["adaptive_light"]:

        # Format: "CONTROL:temp_adjust,light_adjust"
        # Where temp_adjust is -1 (cool), 0 (no change), or 1 (heat)
        # And light_adjust is -1 (dim), 0 (no change), or 1 (brighten)

        command_str = f"CONTROL:{commands['temp_adjust']},{commands['light_adjust']}\n"
        
        try:
            ser.write(command_str.encode())
            print(f"Sent to Arduino: {command_str.strip()}")
        except Exception as e:
            print(f"Error sending commands to Arduino: {e}")


if __name__ == "__main__":
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        time.sleep(2)
        print("Connected to Arduino. Starting communication...")
        
        last_control_check = 0
        control_check_interval = 10  # Check for control updates every 10 seconds
        
        while True:
            # Read data from Arduino
            raw_data = ser.readline().decode("utf-8").strip()
            if raw_data:
                print(f"Received: {raw_data}")
                
                # Check if it's a data line (not a control acknowledgment)
                if raw_data.startswith("temp:") or raw_data.startswith("light:") or raw_data.startswith("pressure:"):
                    parsed_data = parse_data(raw_data)
                    if parsed_data:
                        # Send data to Flask server
                        data_sent = send_to_flask(parsed_data)
                        
                        # Check if it's time to send control commands
                        current_time = time.time()
                        if data_sent and (current_time - last_control_check >= control_check_interval):
                            # Get and send control commands
                            commands = get_control_commands()
                            if commands:
                                send_commands_to_arduino(ser, commands)
                            last_control_check = current_time
            
            time.sleep(1)
    except serial.SerialException as e:
        print(f"Serial connection error: {e}")