#include <Servo.h>

const int PIN_RED   = 11;
const int PIN_GREEN = 9;
const int PIN_BLUE  = 6;
const int lightSensor = A0;
const int tempSensor =  A1;
const int buttonPin2 = 2;
const int buttonPin4 = 4;



float maxLight = 30;
float idealTemp = 18.5;
bool autoTemp = true;
bool adaptiveLight = true;


const unsigned long SEND_INTERVAL = 5000;  // Send data every 5 seconds
unsigned long lastSendTime = 0;

int buttonState2 = 0; 
int buttonState4 = 0; 

bool isSleeping = false;

Servo fanServo;  // Create a Servo object
int servoPin = 7; // Connect the servo signal wire to pin 9

void setup() {
  Serial.begin(9600);

  // put your setup code here, to run once:
  pinMode(PIN_RED,   OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_BLUE,  OUTPUT);
  pinMode(lightSensor, INPUT);
  pinMode(buttonPin2, INPUT_PULLUP);
  pinMode(buttonPin4, INPUT_PULLUP);

  delay(2000);  // Give time to initialize

  fanServo.attach(servoPin); // Attach the servo
}

void loop() {
  //Read sensors
  float light = readRoomBrightness();
  float temp = readRoomTemp();
  readBedSensor();
  int pressure = isSleeping ? 1:0;

  //Read commands

  //Send data to client
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    sendSensorData(light,temp,pressure);
    lastSendTime = currentTime;
  }
}

void controlEnvironment(int pressure, float currentTemp, int currentLight) {
  // Temperature control
  if (autoTemp) {
    float tempDiff = idealTemp - currentTemp;
    if (tempDiff > 1) {
      // Heat up - trigger heating logic
    } else if (tempDiff < -1) {
      rotateFan();
    }
  }
  
  // Light control
  if (adaptiveLight) {
    if (currentLight > maxLight) {
      // Dim lights - trigger dimming logic
    } else if (currentLight < 5) {
      // Brighten lights - trigger brightening logic
    }
  }
}

void sendSensorData(float light, float temp, int pressure){
  //Send data to serial
  Serial.print("temp:");
  Serial.print(temp);
  Serial.print(",light:");
  Serial.print(light);
  Serial.print(",pressure:");
  Serial.println(pressure);
}


void changeLEDColor(int red, int green, int blue) {
  analogWrite(PIN_RED,   red);
  analogWrite(PIN_GREEN, green);
  analogWrite(PIN_BLUE,  blue);
}

float readRoomBrightness() {
   int rawValue = analogRead(lightSensor);
   return map(rawValue, 0, 1023, 0, 100);
}

float readRoomTemp() {
  int sensorValue = analogRead(tempSensor);
  float voltage = sensorValue * (5.0 / 1023.0); 
  float temperature = (voltage - 0.5) * 100.0; 
  return temperature;
}

void rotateFan() {
  // Make the servo act like a fan
  fanServo.write(0);    // Move to position 0 degrees
  delay(500);           // Wait for 500ms
  fanServo.write(180);  // Move to 180 degrees
}

void readBedSensor() {
  static int lastButtonState2 = HIGH;
  static int lastButtonState4 = HIGH;
  static unsigned long lastDebounceTime = 0;
  const unsigned long debounceDelay = 50;  // 50ms debounce

  int currentButtonState2 = digitalRead(buttonPin2);
  int currentButtonState4 = digitalRead(buttonPin4);
  unsigned long currentTime = millis();

  if ((currentButtonState2 == LOW && lastButtonState2 == HIGH) ||
      (currentButtonState4 == LOW && lastButtonState4 == HIGH)) {
    if (currentTime - lastDebounceTime > debounceDelay) {
      isSleeping = !isSleeping;
      Serial.print("isSleeping: ");
      Serial.println(isSleeping);
      lastDebounceTime = currentTime;
    }
  }

  lastButtonState2 = currentButtonState2;
  lastButtonState4 = currentButtonState4;
}