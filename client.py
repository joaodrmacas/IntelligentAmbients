import serial
import requests
import time

SERIAL_PORT = "COM3" 
BAUD_RATE = 9600
FLASK_API_URL = "http://127.0.0.1:5000/sensor-data"

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

if __name__ == "__main__":
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        time.sleep(2)
        print("Reading from Arduino...")
        while True:
            raw_data = ser.readline().decode("utf-8").strip()
            if raw_data:
                print(f"Received: {raw_data}")
                parsed_data = parse_data(raw_data)
                if parsed_data:
                    send_to_flask(parsed_data)
            time.sleep(1)
    except serial.SerialException as e:
        print(f"Serial connection error: {e}")
