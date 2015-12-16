#include <WS2812.h>
#include <DigiCDC.h>

#define LEDCount 37
#define outputPin 1
WS2812 LED(LEDCount); 
cRGB value;

void setup() {
  SerialUSB.begin();
  LED.setOutput(outputPin);
}

void loop() {
  if (SerialUSB.available() > 0) {
    byte command = SerialUSB.read();
    if (command == 0x11) {
      LED.sync();
      
      SerialUSB.write(0x1f);
    }
    else if (command == 0x12) {
      while (SerialUSB.available() < 4) {
      }
      
      int pos = SerialUSB.read();
      value.r = SerialUSB.read();
      value.g = SerialUSB.read();
      value.b = SerialUSB.read();
      
      LED.set_crgb_at(pos, value);
  
      SerialUSB.write(0x1f);
    }
    else {
      SerialUSB.write(0x1e);
    }
  }
}

