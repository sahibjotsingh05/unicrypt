#include <Wire.h>
#include <LiquidCrystal.h>
#include <SPI.h>
#include <MFRC522.h>
#include <IRremote.hpp>
#include <WiFi.h>
#include <HTTPClient.h>

// API Info
const char* ssid = "Nordy";
const char* password = "qwerty123";

// RFID Setup
#define SS_PIN 21
#define RST_PIN 22
MFRC522 rfid(SS_PIN, RST_PIN);

// LCD1602 (Parallel) Setup
#define RS 14
#define E  27
#define D4 26
#define D5 25
#define D6 33
#define D7 32
LiquidCrystal lcd(RS, E, D4, D5, D6, D7);

// Buzzer & LEDs
#define BUZZER_PIN 5
#define RED_LED 4
#define GREEN_LED 16

// IR Receiver
#define IR_PIN 15
IRrecv irrecv(IR_PIN);
decode_results results;

// Modes: 1 = Door, 2 = Ticket, 3 = Attendance, 4 = ID Verification
int mode = 1;
String modeNames[] = {"Door", "Ticket", "Attendance", "ID Check"};
String lastMessage = "Please tap";

// Mock database
//String doorAccessUIDs[] = {"AB1234", "CD5678", "45F5882F67580"};
//String ticketAccessUIDs[] = {"EF9012", "GH3456"};
//String attendanceUIDs[] = {"IJ7890", "KL1234", "45F5882F67580"};
//String idVerificationUIDs[] = {"MN5678", "OP9012"};

void setup() {
    Serial.begin(115200);
    SPI.begin();
    rfid.PCD_Init();

    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(RED_LED, OUTPUT);
    pinMode(GREEN_LED, OUTPUT);

    lcd.begin(16, 2);
    updateLCD();

    irrecv.enableIRIn();  // Start IR receiver
}

void loop() {
    checkIRRemote();  // Check if user selects a mode
    
    if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
        return;  // No card detected
    }

    String scannedID = getScannedID();
    Serial.print("Scanned ID: ");
    Serial.println(scannedID);
    digitalWrite(GREEN_LED, HIGH);
    tone(BUZZER_PIN, 1000, 500);
    delay(1000);
    digitalWrite(GREEN_LED, LOW);

    
    // Process based on selected mode
    if (mode == 1) validateDoorAccess(scannedID);
    else if (mode == 2) validateTicket(scannedID);
    else if (mode == 3) validateAttendance(scannedID);
    else if (mode == 4) validateID(scannedID);

    rfid.PICC_HaltA();
}

// Read RFID UID
String getScannedID() {
    String id = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
        id += String(rfid.uid.uidByte[i], HEX);
    }
    id.toUpperCase();
    return id;
}

// Handle IR remote mode selection
void checkIRRemote() {
    if (irrecv.decode()) {
        Serial.print("IR Code: 0x");
        Serial.println(irrecv.decodedIRData.command, HEX);

        if (irrecv.decodedIRData.command == 0xC) mode = 1;
        else if (irrecv.decodedIRData.command == 0x18) mode = 2;
        else if (irrecv.decodedIRData.command == 0x5E) mode = 3;
        else if (irrecv.decodedIRData.command == 0x8) mode = 4;
        
        updateLCD();
        irrecv.resume();  // Continue receiving IR signals
    }
}

// Update LCD display
void updateLCD() {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(modeNames[mode - 1]);  // Display current mode
    lcd.setCursor(0, 1);
    lcd.print(lastMessage);  // Display last message
}

// Mock API functions
void validateDoorAccess(String id) {
            char* serverUrl="http://3.94.208.17:2000/validateAccess";
            WiFi.begin(ssid, password);
            while (WiFi.status() != WL_CONNECTED) {
              delay(1000);
              Serial.print(".");
           }
            if (WiFi.status() == WL_CONNECTED) {
                HTTPClient http;
                http.begin(serverUrl);
                http.addHeader("Content-Type", "application/json");
                String payload = "{\"studentId\":\"" + id + "\",\"verificationType\":\"door\"}";
                Serial.println("Sending request: ");

                int httpResponseCode = http.POST(payload);

                if (httpResponseCode > 0) {
                    String response = http.getString();
                    WiFi.disconnect();
                    Serial.println("Response: " + response);

                    if (response.indexOf("\"valid\":true") != -1) {
                        
                        grantAccess();
                    } else {
                        denyAccess();
                        Serial.println("You don't have access: " + response);
                    }
                } else {
                    WiFi.disconnect();
                    Serial.println("Error in sending request: " + http.errorToString(httpResponseCode));
                }

                http.end();
            } else {
                Serial.println("WiFi Disconnected!");
            }
        }

void validateTicket(String id){
              char* serverUrl="http://3.94.208.17:2000/validateAccess";
            WiFi.begin(ssid, password);
            while (WiFi.status() != WL_CONNECTED) {
              delay(1000);
              Serial.print(".");
           }
            if (WiFi.status() == WL_CONNECTED) {
                HTTPClient http;
                http.begin(serverUrl);
                http.addHeader("Content-Type", "application/json");
                String payload = "{\"studentId\":\"" + id + "\",\"verificationType\":\"ticket\"}";
                Serial.println("Sending request: ");

                int httpResponseCode = http.POST(payload);

                if (httpResponseCode > 0) {
                    String response = http.getString();
                    WiFi.disconnect();
                    Serial.println("Response: " + response);

                    if (response.indexOf("\"valid\":true") != -1) {
                        
                        grantAccess();
                    } else {
                        denyAccess();
                        Serial.println("You don't have access: " + response);
                    }
                } else {
                    WiFi.disconnect();
                    Serial.println("Error in sending request: " + http.errorToString(httpResponseCode));
                }

                http.end();
            } else {
                Serial.println("WiFi Disconnected!");
            }
        }


void validateAttendance(String id) {             
  char* serverUrl="http://3.94.208.17:2000/incrementAttendance";
            WiFi.begin(ssid, password);
            while (WiFi.status() != WL_CONNECTED) {
              delay(1000);
              Serial.print(".");
           }
            if (WiFi.status() == WL_CONNECTED) {
                HTTPClient http;
                http.begin(serverUrl);
                http.addHeader("Content-Type", "application/json");
                String payload = "{\"studentId\":\"" + id + "\",\"verificationType\":\"studentId\"}";
                Serial.println("Sending request: ");

                int httpResponseCode = http.POST(payload);

                if (httpResponseCode > 0) {
                    String response = http.getString();
                    WiFi.disconnect();
                    Serial.println("Response: " + response);

                    if (response.indexOf("\"valid\":true") != -1) {
                        
                        grantAccess();
                    } else {
                        denyAccess();
                        Serial.println("You don't have access: " + response);
                    }
                } else {
                    WiFi.disconnect();
                    Serial.println("Error in sending request: " + http.errorToString(httpResponseCode));
                }

                http.end();
            } else {
                Serial.println("WiFi Disconnected!");
            }
        }
void validateID(String id){             
  char* serverUrl="http://3.94.208.17:2000/validateAccess";
            WiFi.begin(ssid, password);
            while (WiFi.status() != WL_CONNECTED) {
              delay(1000);
              Serial.print(".");
           }
            if (WiFi.status() == WL_CONNECTED) {
                HTTPClient http;
                http.begin(serverUrl);
                http.addHeader("Content-Type", "application/json");
                String payload = "{\"studentId\":\"" + id + "\",\"verificationType\":\"studentId\"}";
                Serial.println("Sending request: ");

                int httpResponseCode = http.POST(payload);

                if (httpResponseCode > 0) {
                    String response = http.getString();
                    WiFi.disconnect();
                    Serial.println("Response: " + response);

                    if (response.indexOf("\"valid\":true") != -1) {
                        
                        grantAccess();
                    } else {
                        denyAccess();
                        Serial.println("You don't have access: " + response);
                    }
                } else {
                    WiFi.disconnect();
                    Serial.println("Error in sending request: " + http.errorToString(httpResponseCode));
                }

                http.end();
            } else {
                Serial.println("WiFi Disconnected!");
            }
        }


// Validate Access
void validateAccess(String id, String database[], int size) {
    bool found = false;
    for (int i = 0; i < size; i++) {
        if (id == database[i]) {
            found = true;
            break;
        }
    }

    if (found) {
        grantAccess();
    } else {
        denyAccess();
    }
    updateLCD();
    delay(2000); // Wait 2 seconds
    lastMessage = "Please tap";
    updateLCD();
}

// Success
void grantAccess() {
    Serial.println("Access Granted!");
    lastMessage = "Access Granted!";
    digitalWrite(GREEN_LED, HIGH);
    tone(BUZZER_PIN, 1000, 500);
    delay(1000);
    digitalWrite(GREEN_LED, LOW);
}

// Failure
void denyAccess() {
    Serial.println("Access Denied!");
    lastMessage = "Access Denied!";
    digitalWrite(RED_LED, HIGH);
    tone(BUZZER_PIN, 500, 1000);
    delay(1000);
    digitalWrite(RED_LED, LOW);
}