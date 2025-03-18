// Pins for sensors
#define TEMP_SENSOR_PIN A0
#define LIGHT_SENSOR_PIN A1
#define PRESSURE_SENSOR_PIN A2

// Pins for actuators
#define HEATING_PIN 9    // PWM pin for heating element/relay
#define COOLING_PIN 10   // PWM pin for cooling element/fan
#define LIGHT_CONTROL_PIN 11  // PWM pin for light control

// Constants
const unsigned long SEND_INTERVAL = 5000;  // Send data every 5 seconds
unsigned long lastSendTime = 0;

// Environmental control variables
int tempAdjustment = 0;  // -1 = cool, 0 = no change, 1 = heat
int lightAdjustment = 0; // -1 = dim, 0 = no change, 1 = brighten

// Current actuator values
int heatingValue = 0;    // 0-255
int coolingValue = 0;    // 0-255
int lightValue = 128;    // 0-255, start at midpoint

void setup() {
  Serial.begin(9600);
  
  // Setup pins
  pinMode(HEATING_PIN, OUTPUT);
  pinMode(COOLING_PIN, OUTPUT);
  pinMode(LIGHT_CONTROL_PIN, OUTPUT);
  
  // Initialize actuators
  analogWrite(HEATING_PIN, 0);
  analogWrite(COOLING_PIN, 0);
  analogWrite(LIGHT_CONTROL_PIN, lightValue);
  
  delay(2000);  // Give time to initialize
  Serial.println("Smart Bedroom Environment Controller initialized");
}

void loop() {
  // Check for incoming commands
  checkForCommands();
  
  // Apply environmental adjustments
  applyEnvironmentAdjustments();
  
  // Read sensor data at regular intervals
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    sendSensorData();
    lastSendTime = currentTime;
  }
}

void checkForCommands() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    
    if (command.startsWith("CONTROL:")) {
      // Parse command: "CONTROL:temp_adjust,light_adjust"
      String values = command.substring(8); // Remove "CONTROL:"
      
      // Split by comma
      int commaIndex = values.indexOf(',');
      if (commaIndex != -1) {
        tempAdjustment = values.substring(0, commaIndex).toInt();
        lightAdjustment = values.substring(commaIndex + 1).toInt();
        
        // Acknowledge command
        Serial.print("ACK:CONTROL:");
        Serial.print(tempAdjustment);
        Serial.print(",");
        Serial.println(lightAdjustment);
      }
    }
  }
}

void applyEnvironmentAdjustments() {
  // Apply temperature adjustments
  if (tempAdjustment > 0) {
    // Heating
    heatingValue = min(255, heatingValue + 5);
    coolingValue = max(0, coolingValue - 5);
  } else if (tempAdjustment < 0) {
    // Cooling
    coolingValue = min(255, coolingValue + 5);
    heatingValue = max(0, heatingValue - 5);
  } else {
    // No change, gradually return to neutral
    heatingValue = max(0, heatingValue - 2);
    coolingValue = max(0, coolingValue - 2);
  }
  
  // Apply light adjustments
  if (lightAdjustment > 0) {
    // Brighten
    lightValue = min(255, lightValue + 5);
  } else if (lightAdjustment < 0) {
    // Dim
    lightValue = max(0, lightValue - 5);
  }
  
  // Apply values to actuators
  analogWrite(HEATING_PIN, heatingValue);
  analogWrite(COOLING_PIN, coolingValue);
  analogWrite(LIGHT_CONTROL_PIN, lightValue);
}

void sendSensorData() {
  // Read sensor values
  float temperature = readTemperature();
  float light = readLightPercentage();
  int pressure = readPressure();
  
  // Send data to serial (Python client)
  Serial.print("temp:");
  Serial.print(temperature);
  Serial.print(",light:");
  Serial.print(light);
  Serial.print(",pressure:");
  Serial.println(pressure);
}

float readTemperature() {
  // Read analog value and convert to Celsius
  int rawValue = analogRead(TEMP_SENSOR_PIN);
  float voltage = rawValue * 5.0 / 1023.0;
  // Using TMP36 sensor (adjust formula for your specific sensor)
  return (voltage - 0.5) * 100.0;
}

float readLightPercentage() {
  // Read light sensor and convert to percentage
  int rawValue = analogRead(LIGHT_SENSOR_PIN);
  return map(rawValue, 0, 1023, 0, 100);
}

int readPressure() {
  // Read pressure sensor (for bed occupancy)
  int rawValue = analogRead(PRESSURE_SENSOR_PIN);
  return map(rawValue, 0, 1023, 0, 100);
}