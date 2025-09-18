#include <ESP32Servo.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ======== Multi WiFi Config =========
const char* ssids[] = {"Hh"};
const char* passwords[] = {"2345679.."};
const int wifiCount = 1;

// ======== Server =========
const char* serverUrl = "http://31.97.189.33:85/api";

// ======== OLED =========
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ======== Pin Setup =========
#define TRIG_PIN 12
#define ECHO_PIN 13
#define SOIL_PIN 34
#define LED_GERBANG1 2
#define LED_GERBANG2 4
#define SERVO1_PIN 18
#define SERVO2_PIN 19

Servo servo1, servo2;

// ======== Servo calibration (sesuaikan jika perlu) ========
const int SERVO1_STOP = 1475;
const int SERVO2_STOP = 1503;
const int SERVO_OPEN_PULSE  = 1750;
const int SERVO_CLOSE_PULSE = 1200;

bool gerbang1Terbuka = false;
bool gerbang2Terbuka = false;
bool isManualMode = false; // Variabel untuk mode manual/otomatis

const int soilDryThreshold = 3300;
const int soilWetThreshold = 3100;

unsigned long lastSend = 0;
unsigned long sendInterval = 5000;

void setup() {
  Serial.begin(115200);

  // OLED
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED tidak ditemukan");
    while (true);
  }
  display.setRotation(2);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("Inisialisasi...");
  display.display();
  delay(1000);

  // LED & Servo
  pinMode(LED_GERBANG1, OUTPUT);
  pinMode(LED_GERBANG2, OUTPUT);

  servo1.setPeriodHertz(50);
  servo2.setPeriodHertz(50);
  servo1.attach(SERVO1_PIN, 1000, 2000);
  servo2.attach(SERVO2_PIN, 1000, 2000);

  servo1.writeMicroseconds(SERVO1_STOP);
  servo2.writeMicroseconds(SERVO2_STOP);

  // Ultrasonik
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Koneksi WiFi otomatis
  WiFi.mode(WIFI_STA);
  Serial.println("Mencoba konek ke salah satu WiFi...");
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Connecting WiFi...");
  display.display();
  
  bool connected = false;
  for (int i = 0; i < wifiCount; i++) {
    WiFi.begin(ssids[i], passwords[i]);
    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
      delay(500);
    }
    if (WiFi.status() == WL_CONNECTED) {
      connected = true;
      break;
    } else {
      WiFi.disconnect();
    }
  }
  
  display.clearDisplay();
  display.setCursor(0, 0);
  if (connected) {
    display.println("WiFi Connected!");
    display.print("IP: ");
    display.println(WiFi.localIP());
  } else {
    display.println("WiFi Failed!");
    display.println("Retry soon...");
  }
  display.display();
  delay(2000);
}

void loop() {
  // Auto-reconnect WiFi jika terputus
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi terputus! Mencoba reconnect...");
    WiFi.disconnect();
    for (int i = 0; i < wifiCount; i++) {
      WiFi.begin(ssids[i], passwords[i]);
      unsigned long start = millis();
      while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
        delay(500);
      }
      if (WiFi.status() == WL_CONNECTED) {
        Serial.println("WiFi reconnected!");
        break;
      }
    }
  }

  // Cek mode manual dari server setiap interval
  if (millis() - lastSend > sendInterval) {
    checkManualControl();
    lastSend = millis();
  }

  float distance = readUltrasonic();
  int soil = analogRead(SOIL_PIN);
  String statusTanah = (soil > soilDryThreshold) ? "Kering" :
                        (soil < soilWetThreshold) ? "Basah" : "Lembap";

  // Validasi hasil sensor
  if (distance < 0) {
    Serial.println("Sensor ultrasonik gagal baca!");
    distance = 0;
  }

  // Tampilkan data di OLED (minimalkan flicker)
  static float lastDistance = -999;
  static int lastSoil = -999;
  static bool lastG1 = false, lastG2 = false, lastManual = false;
  if (distance != lastDistance || soil != lastSoil || gerbang1Terbuka != lastG1 || gerbang2Terbuka != lastG2 || isManualMode != lastManual) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println(isManualMode ? "MODE: MANUAL" : "MODE: OTOMATIS");
    display.println("----------------");
    display.print("Jarak: "); display.print(distance); display.println(" cm");
    display.print("Tanah: "); display.print(soil); display.print(" "); display.println(statusTanah);
    display.print("G1: "); display.println(gerbang1Terbuka ? "BUKA" : "TUTUP");
    display.print("G2: "); display.println(gerbang2Terbuka ? "BUKA" : "TUTUP");
    display.display();
    lastDistance = distance;
    lastSoil = soil;
    lastG1 = gerbang1Terbuka;
    lastG2 = gerbang2Terbuka;
    lastManual = isManualMode;
  }

  // Otomatisasi hanya jika mode tidak manual
  if (!isManualMode) {
    // Logika otomatis buka/tutup gerbang 1
    if (distance > 9 && statusTanah == "Kering" && !gerbang1Terbuka) {
      kontrolGerbang(servo1, LED_GERBANG1, gerbang1Terbuka, true);
    } else if (distance <= 7 && statusTanah == "Basah" && gerbang1Terbuka) {
      kontrolGerbang(servo1, LED_GERBANG1, gerbang1Terbuka, false);
    }

    // Logika otomatis buka/tutup gerbang 2
    if (distance < 5 && statusTanah == "Basah" && !gerbang2Terbuka) {
      kontrolGerbang(servo2, LED_GERBANG2, gerbang2Terbuka, true);
    } else if (distance > 6 && statusTanah == "Basah" && gerbang2Terbuka) {
      kontrolGerbang(servo2, LED_GERBANG2, gerbang2Terbuka, false);
    }
  }

  // Kirim data sensor ke server
  bool sendOk = sendSensorData(distance, soil, gerbang1Terbuka, gerbang2Terbuka);
  if (!sendOk) {
    Serial.println("Gagal mengirim data ke server!");
  }

  delay(500);
}

// ===== Fungsi Tambahan =====
void kontrolGerbang(Servo& s, int led, bool& status, bool buka) {
  int pulse = buka ? SERVO_OPEN_PULSE : SERVO_CLOSE_PULSE;
  s.writeMicroseconds(pulse);

  delay(1000);

  if (&s == &servo1) {
    s.writeMicroseconds(SERVO1_STOP);
  } else if (&s == &servo2) {
    s.writeMicroseconds(SERVO2_STOP);
  } else {
    s.writeMicroseconds(1475);
  }

  digitalWrite(led, buka ? HIGH : LOW);
  status = buka;
}

float readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 50000);

  if (duration == 0) {
    return -1.0;
  }

  float distance = duration * 0.0343 / 2;

  if (distance > 400) {
    return 400.0;
  }
  
  return distance;
}

bool sendSensorData(float jarak, int soil, bool g1, bool g2) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(serverUrl) + "/data");
    http.addHeader("Content-Type", "application/json");
    StaticJsonDocument<200> doc;
    doc["jarak"] = jarak;
    doc["kelembapan"] = soil;
    doc["gerbang1"] = g1;
    doc["gerbang2"] = g2;
    doc["mode"] = isManualMode; // Tambahkan status mode
    String payload;
    serializeJson(doc, payload);
    int httpCode = http.POST(payload);
    Serial.print("POST Status: "); Serial.println(httpCode);
    http.end();
    return (httpCode == 200 || httpCode == 201);
  }
  return false;
}

void checkManualControl() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    // Menggunakan HTTP GET untuk membaca status kontrol dari server
    http.begin(String(serverUrl) + "/user/control"); // Pastikan URL-nya benar, sebelumnya ada yang menggunakan /user/control
    
    Serial.println("Mengirim permintaan GET ke server...");

    int code = http.GET();
    
    if (code == 200) {
      String res = http.getString();
      Serial.print("Respons dari server: ");
      Serial.println(res);

      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, res);
      
      if (error) {
        Serial.print("Gagal mengurai JSON: ");
        Serial.println(error.c_str());
      } else {
        bool g1 = doc["gerbang1"];
        bool g2 = doc["gerbang2"];
        bool modeFromServer = doc["mode"]; 

        // Tampilkan nilai yang dibaca untuk debug
        Serial.print("Gerbang 1 (dari server): "); Serial.println(g1);
        Serial.print("Gerbang 2 (dari server): "); Serial.println(g2);
        Serial.print("Mode (dari server): "); Serial.println(modeFromServer);

        // Perbarui mode hanya jika ada perubahan
        if (isManualMode != modeFromServer) {
          isManualMode = modeFromServer;
          Serial.print("Mode diubah menjadi: ");
          Serial.println(isManualMode ? "MANUAL" : "OTOMATIS");
        }
        
        // Logika kontrol gerbang tetap sama, hanya dieksekusi di mode manual
        if (isManualMode) {
          if (g1 != gerbang1Terbuka) {
            kontrolGerbang(servo1, LED_GERBANG1, gerbang1Terbuka, g1);
          }
          if (g2 != gerbang2Terbuka) {
            kontrolGerbang(servo2, LED_GERBANG2, gerbang2Terbuka, g2);
          }
        }
      }
    } else {
      Serial.print("Gagal mengambil data kontrol. Kode HTTP: ");
      Serial.println(code);
    }
    http.end();
  }
}