var fs = require("fs");
var fstream = require("fstream");
var unzip = require("unzip");
var rimraf = require("rimraf");
var multer  = require("multer");

var upload = multer({ dest: "uploads/" });

module.exports = function() {
    return [upload.single("kmz"), kmzUpload];
};

function kmzUpload(req, res) {
    rimraf(__dirname + "/../../public/data/kml/*", () => {
        var readStream = fs.createReadStream(req.file.path);
        var writeStream = fstream.Writer(__dirname + "/../../public/data/kml/");

        readStream.pipe(unzip.Parse())
        .on("finish", () => {
            res.send();
            fs.unlink(req.file.path);
        })
        .pipe(writeStream);
    });


}
