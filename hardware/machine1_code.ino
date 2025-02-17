
#include <LiquidCrystal.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Nordy";
const char* password = "qwerty123";

#define SS_PIN 21
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal lcd(13, 12, 14, 27, 26, 25);

String Merchant = "SubMart";
float Amount = 0;
int machineState = 0;
const char* serverUrl = "http://3.94.208.17:2000/transfer";

char digits[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'};
int digitPointer = 0;
char acceptedDigits[20] = "";
int digitCount = 0;
String uid = "";
bool uidExists = false;
bool paymentCompleted = false;

void displayText(String line1, String line2) {
    lcd.setCursor(0, 0);
    lcd.print("                ");  // Clear line manually
    lcd.setCursor(0, 0);
    lcd.print(line1);

    lcd.setCursor(0, 1);
    lcd.print("                ");  // Clear line manually
    lcd.setCursor(0, 1);
    lcd.print(line2);
}

void setup() {
    lcd.begin(16, 2); 
    displayText("Welcome To", Merchant);
    Serial.begin(115200);
    
    
    Serial.print("Connecting to WiFi");

    
    Serial.println("\nConnected to WiFi");
    SPI.begin();
    rfid.PCD_Init();
    Serial.println("RFID Reader Initialized!");

    pinMode(35, INPUT); // Btn 1 - Back to home
    pinMode(34, INPUT); // Btn 2 - Next digit
    pinMode(32, INPUT); // Btn 3 - Accept digit
    pinMode(15, INPUT); // Btn 4 - Delete digit
    pinMode(2, INPUT);  // Btn 5 - Confirm amount

    machineState = 0;
}

void loop() {
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
        uid = "";
        for (byte i = 0; i < rfid.uid.size; i++) {
            uid += (rfid.uid.uidByte[i] < 0x10 ? "0" : "");
            uid += String(rfid.uid.uidByte[i], HEX);
        }
        uidExists = true;
        machineState = 2; // Move to next state automatically
    }

    bool sensorState1 = digitalRead(35);
    bool sensorState2 = digitalRead(34);
    bool sensorState3 = digitalRead(32);
    bool sensorState4 = digitalRead(15);
    bool sensorState5 = digitalRead(2);

    if (sensorState1 || sensorState2 || sensorState3 || sensorState4 || sensorState5 || uidExists) {
        Serial.println("Button Pressed");

        if (machineState == 0) {
            if (sensorState1 == HIGH) {
                machineState = 1;
                Serial.println("Btn1: Enter Amount");
                delay(300);
                displayText("Enter Amount:", "0");
            }
        } 
        else if (machineState == 1) {
            if (sensorState1 == HIGH) { 
                machineState = 0;
                Serial.println("Btn1: Back to Home");
                delay(300);
                displayText("Welcome To", Merchant);
            } 
            else if (sensorState2 == HIGH) { 
                digitPointer = (digitPointer + 1) % 11;
                String selectedDigit = String(digits[digitPointer]);
                Serial.println("Btn2: Next Digit " + selectedDigit);
                delay(300);
                displayText("Enter Amount:", selectedDigit);
            } 
            else if (sensorState3 == HIGH) { 
                if (digitCount < 19) {  
                    acceptedDigits[digitCount] = digits[digitPointer];
                    digitCount++;
                    acceptedDigits[digitCount] = '\0';
                }
                Serial.println("Btn3: Digit Accepted: " + String(acceptedDigits));
                delay(300);
                displayText("Enter Amount:", String(acceptedDigits));
            } 
            else if (sensorState4 == HIGH) { 
                if (digitCount > 0) {
                    digitCount--;  
                    acceptedDigits[digitCount] = '\0';  
                }
                Serial.println("Btn4: Delete Last Digit: " + String(acceptedDigits));
                delay(300);
                displayText("Enter Amount:", String(acceptedDigits));
            } 
            else if (sensorState5 == HIGH) { 
                Amount = atof(acceptedDigits);
                Serial.println("Btn5: Amount Confirmed: " + String(Amount, 2));
                delay(300);
                displayText("Amount Set:", String(Amount, 2));
                machineState = 2;
                uidExists = false;
            }
        }
        else if (machineState == 2) {
            Serial.println("UID Received");
            Serial.println(uid);
            machineState = 3;
        }
        else if (machineState == 3) {
            WiFi.begin(ssid, password);
            while (WiFi.status() != WL_CONNECTED) {
              delay(1000);
              Serial.print(".");
           }
            if (WiFi.status() == WL_CONNECTED) {
                HTTPClient http;
                http.begin(serverUrl);
                http.addHeader("Content-Type", "application/json");

                // Format Amount properly
                char amountBuffer[10];
                dtostrf(Amount, 1, 2, amountBuffer); // Convert float to string with 2 decimal places

                // Create JSON payload
                String payload = "{\"studentId\": \"" + uid + "\", \"merchantId\": 0, \"amount\": \"" + String(Amount) + "\"}";
                Serial.println("Sending request: " + payload);

                int httpResponseCode = http.POST(payload);

                if (httpResponseCode > 0) {
                    String response = http.getString();
                    WiFi.disconnect();
                    Serial.println("Response: " + response);

                    if (response.indexOf("\"success\":true") != -1) {
                        displayText("Payment", "Successful");
                        paymentCompleted = true;
                    } else {
                        displayText("Payment Failed", "");
                        Serial.println("Payment failed: " + response);
                    }
                } else {
                    WiFi.disconnect();
                    Serial.println("Error in sending request: " + http.errorToString(httpResponseCode));
                }

                http.end();
            } else {
                Serial.println("WiFi Disconnected!");
            }

            delay(2000); // Brief delay before resetting state
            machineState = 0;
            paymentCompleted = false;
            uidExists = false;
            uid = ""; // Clear UID to avoid repeated transactions
        }
    }

    delay(100); // Debounce buttons
}