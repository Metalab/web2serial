
/*
 blinks two leds accoring to input over serial.
 this is sample code for our teensy3.1 hack whie testing web2serial
*/



#include "Timer.h"                     //http://github.com/JChristensen/Timer

const int LED1 = 12;                    //connect one LED to this pin (with appropriate current-limiting resistor of course)
const int LED2 = 13;                    //connect another LED to this pin (don't forget the resistor)
unsigned long PERIOD1 = 100;   
unsigned long PERIOD2 = 200;   
Timer t;                               

int t1, t2;
String readString;



void setup(void)
{
  
   Serial.begin(9600);
 //  while (!Serial) {
 //   ; // wait for serial port to connect. Needed for Leonardo only
 //  }
  
  
    pinMode(LED1, OUTPUT);
    pinMode(LED2, OUTPUT);
    t1= t.oscillate(LED1, PERIOD1, HIGH);
    t2= t.oscillate(LED2, PERIOD2, HIGH);
}

void loop(void)
{
  
  
  while (Serial.available()) {
    delay(3);  //delay to allow buffer to fill 
    if (Serial.available() >0) {
      char c = Serial.read();  //gets one byte from serial buffer
      readString += c; //makes the string readString
    } 
  }
  
  
  
  if (readString.length() >0) {
      Serial.println(readString); //see what was received
      
      // expect a string like "090 100" containing the two servo positions      
      String t1_s = readString.substring(0, 3); //get the first four characters
      String t2_s = readString.substring(4, 7); //get the next four characters 


      int t1_i = t1_s.toInt();
      int t2_i = t2_s.toInt();      

            
      if(PERIOD1 !=  t1_i)
      {
        PERIOD1=  t1_i;
        t.stop(t1);
        t1= t.oscillate(LED1, PERIOD1, HIGH);
      }      
         
         
      if(PERIOD2 !=  t2_i)
      {
        PERIOD2=  t2_i;
        t.stop(t2);
        t2= t.oscillate(LED2, PERIOD2, HIGH);
      }         
           
           
      Serial.print("New values: ");     
      Serial.print(PERIOD1);
      Serial.print(" - ");     
      Serial.println(PERIOD2);
   
 
      readString="";
   
  }



  

  
  
    t.update();
}

