require("dotenv").config();
const express = require("express");
const app = express();
const rand = require("crypto").randomBytes;
const Busboy = require("busboy");
const path = require("path");
const fs = require("fs");
const os = require("os");
const tempdir = os.tmpdir();
const videoModel = require("./schema").videoModel;
const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://root:root@cluster0-zcmfs.mongodb.net/examiner?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("mongoose connected"))
  .catch((e) => console.log(e));

var kue = require("kue");
var queue = kue.createQueue({
  prefix: "q",
  redis: {
    port: 6379,
    host: "35.222.176.78",
    db: 3, // if provided select a non-default redis db
  },
});

app.post("/video", (req, res) => {
  let fileuuid = rand(8).toString("hex");
  fs.mkdirSync(path.join(tempdir, "views", fileuuid), { recursive: true });
  let _filename;
  var busboy = new Busboy({ headers: req.headers });
  busboy.on("file", function (fieldname, file, filename) {
    var saveTo = path.join(tempdir, "views", fileuuid, filename);
    file.pipe(fs.createWriteStream(saveTo));

    _filename = filename;
  });

  busboy.on("finish", function () {
    videoModel({
      name: _filename,
    })
      .save()
      .then((video) => {
        const job = queue
          .create("convert", {
            path: path.join(tempdir, "views", fileuuid, _filename),
            fileuuid,
            _filename,
            _id: video._id,
          })
          .removeOnComplete(true)
          .save((err) => {
            if (err) {
              res.send("error");
              return;
            }
            job.on("failed", () => {
              res.send("error");
            });
          });

        res.send(video);
      });
  });

  return req.pipe(busboy);
});

app.get("/video/:id",(req,res)=>{
  videoModel.findById(req.params.id).then(video => {
    res.send(video)
  }).catch(e=> {console.log(e); res.send(e)})
})

app.use("/queue/", (req,res,next)=>{res.set("Cache-Control","no-cache","no-store");next()},kue.app);

app.listen(process.env.PORT || 5000, () =>
  console.log("Example app listening !")
);
