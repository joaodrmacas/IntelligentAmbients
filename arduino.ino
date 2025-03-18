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

int buttonState2 = 0; 
int buttonState4 = 0; 

Servo fanServo;  // Create a Servo object
int servoPin = 7; // Connect the servo signal wire to pin 9

void setup() {
  // put your setup code here, to run once:
  pinMode(PIN_RED,   OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_BLUE,  OUTPUT);
  Serial.begin(9600);
  pinMode(lightSensor, INPUT);
  pinMode(buttonPin2, INPUT);
  pinMode(buttonPin4, INPUT);

  fanServo.attach(servoPin); // Attach the servo
}

void loop() {
  float isInBed = readBedSensor();

  if (readRoomBrightness() > minLightLevel){
    changeLEDColor(0,0,255);
  }else if (isInBed){
    changeLEDColor(255,0,0);
  }

  if (readRoomTemp() > minRoomTemp)
    rotateFan();

  delay(500);
}

void changeLEDColor(int red, int green, int blue) {
  analogWrite(PIN_RED,   red);
  analogWrite(PIN_GREEN, green);
  analogWrite(PIN_BLUE,  blue);
}

int readRoomBrightness() {
   return analogRead(lightSensor);
}

float readRoomTemp() {
  int sensorValue = analogRead(tempSensor);
  float voltage = sensorValue * (5.0 / 1024.0); 
  float temperature = (voltage - 0.5) * 100.0; 

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" °C");  // Print temperature value

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