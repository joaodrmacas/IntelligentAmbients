#include <Servo.h>

const int PIN_RED   = 11;
const int PIN_GREEN = 9;
const int PIN_BLUE  = 6;
const int lightSensor = A0;
const int tempSensor =  A1;
const int buttonPin2 = 2;
const int buttonPin4 = 4;
const int minLightLevel = 200;
const float minRoomTemp = 24;

const unsigned long SEND_INTERVAL = 5000;  // Send data every 5 seconds
unsigned long lastSendTime = 0;

int buttonState2 = 0; 
int buttonState4 = 0; 

Servo fanServo;  // Create a Servo object
int servoPin = 7; // Connect the servo signal wire to pin 9

void setup() {
  Serial.begin(9600);

  // put your setup code here, to run once:
  pinMode(PIN_RED,   OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_BLUE,  OUTPUT);
  pinMode(lightSensor, INPUT);
  pinMode(buttonPin2, INPUT);
  pinMode(buttonPin4, INPUT);

  delay(2000);  // Give time to initialize

  fanServo.attach(servoPin); // Attach the servo
}

void loop() {
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    sendSensorData();
    lastSendTime = currentTime;
  }
}

void sendSensorData(){
  float light = readLightPercentage();
  float temp = readRoomTemp();
  float pressure = 0;
  int pressure = readBedSensor() ? 1 : 0;

  //Send data to serial
  Serial.print("temp:");
  Serial.print(temperature);
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
   int rawValue = analogRead(LIGHT_SENSOR_PIN);
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

bool readBedSensor(){
  buttonState2 = digitalRead(buttonPin2);
  if (buttonState2 == HIGH) {
    return true;
  }

  buttonState4 = digitalRead(buttonPin4);
  if (buttonState4 == HIGH) {
    return true;
  }

  return false;
}