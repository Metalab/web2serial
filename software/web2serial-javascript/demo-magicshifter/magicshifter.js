function getFromURL(url, responseType, cb) {
        var r = new XMLHttpRequest();
        r.open("GET", url, true);  
        // "arraybuffer", "blob", "document", "json", and "text".
        r.responseType = responseType;
        r.onload = function() {   // XHR2
            if (cb) cb(r.response); // XHR2
        };    
        r.send();            
    }


function TimeScedule() {
    this.queue = [];

    this.add = function(cb, delay) {
        this.queue[this.queue.length] = ({cb:cb, delay:delay});
    }

    this.run = function() {
        var q = this.queue.reverse();
        var recursiveFunction = function() {
            if (q.length > 0) {
                var item = q.pop();
                setTimeout(function () {
                    item.cb();
                    recursiveFunction();
                }, item.delay);
            }
        };
        recursiveFunction();
    }
}

function magicUpload(sector, url, socket, cb) {
    getFromURL(url, "arraybuffer", function(arraybufer) {   
        magicUploadArrayBuffer(sector, arraybuffer, socket, cb);
    });
}

function magicUploadArrayBuffer(sector, arraybuffer, socket, cb)
{
    var s = new TimeScedule();
    s.add(function() {
        socket.send("MAGIC_UPLOAD");
    }, 5);
    s.add(function() {
        socket.send(String.fromCharCode(sector));
        socket.send(String.fromCharCode(0xFF &(arraybuffer.byteLength >> 8)));
        socket.send(String.fromCharCode(0xFF & arraybuffer.byteLength));
    }, 100);

    s.add(function() {

    }, 1500);

    var delay = 3;
    var stepSize = 32;
    for (var idx = 0; idx < arraybuffer.byteLength; idx += stepSize) {
        (function() {
            var subarray = arraybuffer.slice(idx, idx+stepSize);
            var typed = new Uint8Array(subarray);
            var text = ab2str(subarray);
            console.log("sendin: " + text)
            s.add(function () {
                socket.send(text);
            }, delay);
        })();
    }

    s.add(function() {
        cb();
    }, 500);

    s.run();
}

function magicPing(socket, cb) {
     var s = new TimeScedule();
    s.add(function() {
        socket.send("MAGIC_PING\n");
    }, 5);
    s.add(function() {
        cb();
    }, 100);
    s.run();
}
