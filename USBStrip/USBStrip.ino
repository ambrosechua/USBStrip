// TODO: Rewrite everything

#include <WS2812.h>
// TODO: switch to FastLED.io
#include <CapacitiveSensor.h>

#define LEDCount 37
#define outputPin 11
WS2812 LED(LEDCount);
cRGB value;
CapacitiveSensor capv_btn1 = CapacitiveSensor(4, 2);
bool capv_btn1_state = false;
int capv_btn1_avg = 0;

void setup() {
  //Serial.begin(230400);
  Serial.begin(115200);
  LED.setOutput(outputPin);
  capv_btn1.set_CS_AutocaL_Millis(0xFFFFFFFF);
}

int capv_btn1_v;
void loop() {
  //int capv_btn1_v = capv_btn1.capacitiveSensor(1);
  capv_btn1_avg = (capv_btn1.capacitiveSensor(1) + capv_btn1_avg * 20) / 21;
  capv_btn1_v = capv_btn1_avg;
  if (capv_btn1_v > 70 && !capv_btn1_state) {
    Serial.write(0x17);
    Serial.write(0xff);
    capv_btn1_avg += 1000000;
    capv_btn1_state = true;
    digitalWrite(13, HIGH);
  }
  else if (capv_btn1_v < 30 && capv_btn1_state) {
    Serial.write(0x17);
    Serial.write(0x00);
    capv_btn1_state = false;
    digitalWrite(13, LOW);
  }

  if (Serial.available() > 0) {
    byte command = Serial.read();
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
      Serial.write(0x1b);
    }
    else {
      Serial.write(0x1e);
    }
  }
}

