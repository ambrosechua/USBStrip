#include <WS2812.h>

#define LEDCount 37
#define outputPin 11
WS2812 LED(LEDCount); 
cRGB value;

void setup() {
  //Serial.begin(230400);
  Serial.begin(115200);
  LED.setOutput(outputPin);
}

void loop() {
  if (Serial.available() > 0) {
    byte command = Serial.read();
    //Serial.write(command);
    if (command == 0x11) {
      LED.sync();
      
      Serial.write(0x1a);
    }
    else if (command == 0x12) {
      while (Serial.available() < 4) {
      }
      
      int pos = Serial.read();
      value.r = Serial.read();
      value.g = Serial.read();
      value.b = Serial.read();
      
      LED.set_crgb_at(pos, value);
  
      //Serial.write(pos);
      //Serial.write(value.r);
      //Serial.write(value.g);
      //Serial.write(value.b);
      Serial.write(0x1b);
    }
    else {
      Serial.write(0x1e);
    }
  }
}

