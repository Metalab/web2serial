/**
 * Reference implementation of web2serial.js, which you can
 * use to build for custom web2serial apps.
 *
 * For the API documentation take a look at `web2serial.js`:
 * https://github.com/Metalab/web2serial/blob/master/software/web2serial-javascript/web2serial.js
 */

// Web2SerialSocket
var socket;

// Cache for last devices
var _devices_last;

// Stuff to do when website is loaded
$(function() {
    // Catch form input when user presses enter
    $("#inputform").submit(function() {
        send();
        return false;
    });


$( "#slider1" ).slider({ min:0, max: 255,  slide: slider_slided,  change: slider_changed, orientation: "vertical",  });
$( "#slider2" ).slider({ min:0, max: 255,  slide: slider_slided,  change: slider_changed, orientation: "vertical",  });



    is_alive();
});

function is_alive() {
    // Check whether web2serial-core is running
    web2serial.is_alive(function(alive) {
        if (alive) {
            $("#alert-running").show();
            refresh_devices();
        } else {
            $("#alert-not-running").show();
        }
        setTimeout(is_alive, 500);
    });    
}

// Refresh list of devices
function refresh_devices() {
    web2serial.get_devices(function(device_list) {
        // If nothing changed, we do nothing
        if (JSON.stringify(device_list) == _devices_last) { return; }
        _devices_last = JSON.stringify(device_list);

        // Update list of devices
        $("#devices-list").html("");
        for (var i=0; i<device_list.length; i++) {
            $("#devices-list").append("<div class='device'><button type='button' id='device-" + device_list[i].hash + "' class='btn btn-default' onclick=\"connect('" + device_list[i].hash + "')\" title='click to connect'>" + device_list[i].device + " (" + device_list[i].desc + ", " + device_list[i].hwinfo + ")</button></div>");
        }
    }, false);
}

// Connect to a specific serial device
function connect(device_hash) {
    updateui_connect(device_hash);

    // Create a Web2Serial WebSocket Connection
    socket = web2serial.open_connection(device_hash, 38400);



    // Set event handlers
    socket.onmessage = function(data) {
        // Handle incoming bytes from the serial device
        add_response(data);
    };

    socket.onopen = function(event) {
        // Connection to serial device has been successfully established
        updateui_connection_established(this.device, this.baudrate);

    // enable bluetooth contorl on borsti
    socket.send("MO1\x0a");



    };

    socket.onerror = function(event) {
        // Connection had an error
        updateui_connection_error(this.device, JSON.stringify(event));
    };

    socket.onclose = function(event) {
        // Connection was closed
        updateui_connection_closed(this.device);
    };
}

// Send message from input field to the serial device
function send() {
    var msg = $("#input").val()+"\x0a";


    socket.send(msg);
    add_message("sent: " + msg, "info");
    $("#input").val("").select();
}


// Helper to add messages to the html document
function add_message(str, alert_role) {
    $("#messages").html("<div class='alert alert-" + alert_role + "' role='alert'>" + str + "</div>" + $("#messages").html());
}

function add_response(str) {
    $("#messages").html("<pre>" + str + " (" + str.length + " bytes)</pre>" + $("#messages").html());
}

// UI Update Helpers
function updateui_connect(device_hash) {
    $(".device button").each(function() { $(this).removeClass().addClass("btn btn-default"); });
    $("#input").attr("disabled", "disabled");
    $("#input-btn").attr("disabled", "disabled");

}

function updateui_connection_established(device, baudrate) {
    add_message("opened: " + device.str + ", " + baudrate + " baud", "success");
    $("#device-" + device.hash).removeClass().addClass("btn btn-success");
    $("#input").removeAttr("disabled");
    $("#input-btn").removeAttr("disabled");
    $("#input").select();

    // borsti control panel show
    $("#borsti-controls").show();


}

function updateui_connection_error(device, error_string) {
    add_message("error: " + error_string, "danger");
    $("#device-" + device.hash).removeClass().addClass("btn btn-danger");
}

function updateui_connection_closed(device) {
    $("#input").attr("disabled", "disabled");
    $("#input-btn").attr("disabled", "disabled");
    add_message("closed: " + device.str, "danger");


    // borsti control panel  hide 
    $("#borsti-controls").hide();

}




function drive(val) {
/*SPhhhh Setzen der Motorgeschwindigkeiten, wobei „hhhh“ für die Geschwindigkeitswerte in 
Hexadezimal steht
Die ersten beiden Stellen steuern die Geschwindigkeit des linken Motors, die folgenden 
beiden die des rechten Motors. Gültige Werte sind 0000 bis FFFF
Beispiel für Geradeausfahrt: SPFFFF
Beispiel für linksfahrt: SPFF00
Beispiel für rechtsfahrt: SP00FF
Beispiel für langsame Geradeausfahrt: SP8080
*/



//TODO slider

socket.send("SP"+ val + "\n");

}



function sirene(val){
/*
BEn Setzen der Sirene, wobei „n“ für den Status in Dezimal steht
0: Abgeschaltet (default)
1: Eingeschaltet
*/

socket.send("BE"+ val + "\n");
}

function backlight(val){
/*
REn Setzen der Rücklichter, wobei „n“ für den Status in Dezimal steht
0: Abgeschaltet
1: Blinker links
2: Blinker rechts
3: Warnblinker
4: Dauerhaft eingeschaltet
5: Blinker-Automatik je nach Fahrtrichtung (default)

*/
socket.send("RE"+ val + "\n");


}


function frontlight(val) {
/*
FRn Setzen des Frontlichtes, wobei „n“ für den Status in Dezimal steht
0: Abgeschaltet
1: Eingeschaltet (default)
*/

socket.send("FR"+ val + "\n");
}


function flashlight(val){
/*
FLn Setzen des Blitzlichtes, wobei „n“ für den Status in Dezimal steht
0: Abgeschaltet (default)
1: Blitz
2: Dauerhaft eingeschaltet
*/

socket.send("FL"+ val + "\n");


}



function motortimeout(val){
/*
TOn Setzen des Motortimeouts, wobei „n“ für den Status in Dezimal steht
0: Inaktiv
1: Aktiv (default)
*/

socket.send("TO"+ val + "\n");


}




function slider_changed(event,ui)
{
current_slider = $(ui.handle).parent().attr("id")
eval(current_slider+"_value=ui.value;");



v1 = $('#slider1').slider("option", "value").toString(16);
if(v1.length < 2) v1 = "0" + v1;

v2 = $('#slider2').slider("option", "value").toString(16);
if(v2.length < 2) v2 = "0" + v2;

var hex=v1+""+ v2;


drive(hex.toUpperCase());


}

function slider_slided(event,ui)
{
current_slider = $(ui.handle).parent().attr("id");
$("#"+current_slider+"_display").html(ui.value);

}

