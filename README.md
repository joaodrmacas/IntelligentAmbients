## Smart Bedroom:
# Enhancing Sleep Hygiene with Ambient Intelligence

## Description
????

## Requirements
- Python 3.x
- Necessary libraries (listed in `requirements.txt`)
- Arduino IDE for uploading the firmware to the device

## Installation
1. Clone this repository:
   ```sh
   git clone https://github.com/your-repository.git
   cd your-repository
   ```
2. Install the required Python dependencies:
   ```sh
   pip install -r requirements.txt
   ```

## Execution
### 1. Populate the Database
Before starting the server, the database must be populated.
```sh
cd scripts  # Necessary because the script uses relative paths
python populate_scripts.py
```

### 2. Start the Server
```sh
python server.py
```

### 3. Start the Client
The client communicates with the Arduino via a serial port. Ensure the correct port is set at the beginning of the `client.py` file.
```sh
python client.py
```

### 4. Connect the Arduino
- Connect the Arduino to the computer via USB.
- Open the `arduino.ino` file in the Arduino IDE.
- Select the correct board and port.
- Upload the code to the Arduino.

## Notes
- The serial port value (`SERIAL_PORT`) may need to be adjusted in `client.py` depending on the port where the Arduino is connected.
- If dependency errors occur, ensure all libraries in `requirements.txt` are correctly installed.

## License
This project is licensed under the MIT License. See the `LICENSE` file for more details.

## Author
- [Your Name]  
- [Your Email or Contact]

