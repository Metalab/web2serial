/*
26.Aug. 2014
-overflo / metalab.at



super simple testcode that turns on/off the onboard led of arduino or simlar microcontroller upon serial data is sent in
this code also echoes back the byte that was read from the serial

LGPGL v3.0 applies

*/




// 11 on teensy, 13 on arduino
int led =13;





// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
  pinMode(led,OUTPUT);
  digitalWrite(led,LOW);
}



// the loop routine runs over and over again forever:
void loop() {
 if(Serial.available())
 {
  toggle_led(); 

  // say what you got:
 Serial.print("ARDUINO GOT: ");
 Serial.write(Serial.read());
 Serial.print("\r\n");
 }
}



int state=1;

void toggle_led()
{
    state=!state;
    digitalWrite(led,state);   
}
