# Smart Bedroom:
*Enhancing Sleep Hygiene with Ambient Intelligence*

## Description
The proposed solution addresses one of the main roots of poor sleep: *inadequate sleep hygiene* –
a combination of habits, behaviors and environmental factors that impact overall sleep quality.

As such this project serves as an proof of concept for a *Smart Bedroom* that leverages ambient-aware technology to provide an
unified system aimed to enhance user’s sleep hygiene. Doing it so by monitoring and controlling
user’s environment in regards to light exposure and room temperature, raising awareness about
behavioral issues: time in bed, inconsistent sleep routines while also promoting better sleep
habits like wind-down routines and sleep onset techniques

This project was developed as part of the *Ambient Intelligence 2025* course at IST.

## Requirements
- Python 3.8+
- Flask 3.1.0
- pyserial 3.5
- requests 2.32.3
- Arduino Servo Library
- Arduino IDE 

## Execution

#### 1. Clone this repository:
   ```sh
   git clone https://github.com/joaodrmacas/IntelligentAmbients
   cd IntelligentAmbients/
   ```

#### 2. Populate the Database
Before starting the server, for a  more realistic simulation the database must be populated with sleep data over several days
```sh
cd ./scripts  
python3 populate_sleep.py
```
#### 4. Connect the Arduino
- Connect the Arduino to the computer via the given USB cabble .
- Open the `arduino.ino` file in the Arduino IDE.
- Select the correct board and port.
- Upload the code to the Arduino.

#### 5. Start the Server:
   ```sh
   python3 server.py
   ```
#### 6. Start the Client:
   ```sh
   python3 client.py
   ```



## Notes
- The serial port value (`SERIAL_PORT`) may need to be adjusted in `client.py` depending on the port where the Arduino is connected (usually `PORT 9600`)
- If dependency errors occur, ensure all project libraries are correctly installed.

## Authors
- João Maçãs
- Pedro Cruz `pedro.agostinho.cruz@tecnico.ulisboa.pt`  
- João Pamplona

