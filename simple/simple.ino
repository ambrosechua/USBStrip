#include <Adafruit_NeoPixel.h>

#define PIN            6
#define NUMPIXELS      37

Adafruit_NeoPixel pixels = Adafruit_NeoPixel(NUMPIXELS, PIN, NEO_GRB + NEO_KHZ800);

int delayval = 16;

bool off = false;
int brightness = 255;
int hue = 168;
int mode = 1;

int counter = 0;

uint32_t Wheel(byte WheelPos) {
  WheelPos = 255 - WheelPos;
  if(WheelPos < 85) {
    return pixels.Color((255 - WheelPos * 3) * brightness / 255, 0, WheelPos * 3 * brightness / 255);
  }
  if(WheelPos < 170) {
    WheelPos -= 85;
    return pixels.Color(0, WheelPos * 3 * brightness / 255, (255 - WheelPos * 3) * brightness / 255);
  }
  WheelPos -= 170;
  return pixels.Color(WheelPos * 3 * brightness / 255, (255 - WheelPos * 3) * brightness / 255, 0);
}

void setup() {
  Serial.begin(9600);
  pixels.begin();
}

void loop() {

  if (off) {

    for (int i = 0; i < NUMPIXELS; i++){
      pixels.setPixelColor(i, pixels.Color(0,0,0));
    }
    pixels.show();
    
  }
  else {

    if (mode == 1) {
      for (int i = 0; i < NUMPIXELS; i++){
        pixels.setPixelColor(i, pixels.Color(0,0,brightness));
      }
      pixels.show();
    }
    else if (mode == 2) {
      for (int i = 0; i < NUMPIXELS; i++){
        pixels.setPixelColor(i, Wheel((i * 2 + counter / 2) % 256));
      }
      pixels.show();
    }
    else if (mode == 3) {
      for (int i = 0; i < NUMPIXELS; i++){
        pixels.setPixelColor(i, Wheel(hue % 256));
      }
      pixels.show();
    }
    
    counter++;
  
  }
    
  delay(delayval);

  while (Serial.available() > 0) {

    int command = Serial.parseInt();
    int value = Serial.parseInt();

    if (Serial.read() == '\n') {
      Serial.print("Command: ");
      Serial.println(command);
      Serial.print("Value: ");
      Serial.println(value);
      switch (command) {
  
        case 0:
          off = (value == 0);
          break;
  
        case 1:
          brightness = constrain(value, 0, 255);
          Serial.print("Brightness: ");
          Serial.println(brightness);
          break;
          
        case 2:
          mode = constrain(value, 1, 3);
          Serial.print("Mode: ");
          Serial.println(brightness);
          break;
          
        case 3:
          hue = constrain(value, 0, 255);
          Serial.print("Hue: ");
          Serial.println(hue);
          break;
    
      }
    }
    
  }
  
}

