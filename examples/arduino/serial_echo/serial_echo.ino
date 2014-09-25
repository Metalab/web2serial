/**
 * Simple sketch which opens a serial port with 9600 baud and
 * echos every byte it receives.
 *
 * https://github.com/Metalab/web2serial
 */

void setup() {
    Serial.begin(9600);
}

void loop() {
    if (Serial.available()) {
        int inByte = Serial.read();
        Serial.write(inByte); 
    }
}
