require("dotenv").config();
const kue = require("kue");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { Storage } = require("@google-cloud/storage");
const myBucket = new Storage().bucket("video21984");
const videoModel = require("./schema").videoModel;
const mongoose = require("mongoose");
var rimraf = require("rimraf");
const os = require("os");
const tempdir = os.tmpdir();
const path = require("path");

mongoose
  .connect(
    "mongodb+srv://root:root@cluster0-zcmfs.mongodb.net/examiner?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("mongoose connected"))
  .catch((e) => console.log(e));

var queue = kue.createQueue({
  prefix: "q",
  redis: {
    port: 6379,
    host: "35.222.176.78",
    db: 3, // if provided select a non-default redis db
  },
});

queue.process("convert", (job, done) => {
  console.log(job.data);
  ffmpeg()
    .input(job.data.path)
    .videoCodec("libx264")
    .videoBitrate("1000")
    .size("640x?")
    .format("mp4")
    .output(
      `${tempdir}/views/${job.data.fileuuid}/${job.data._filename}-640.mp4`
    )
    .on("end", () => {
      const bucketfile = myBucket.file(
        job.data.fileuuid + "/" + job.data._filename
      );
      const compressedBucketfile = myBucket.file(
        job.data.fileuuid + "/" + job.data._filename + "-640.mp4"
      );
      const file = fs.createReadStream(job.data.path);
      const compressed = fs.createReadStream(
        `${tempdir}/views/${job.data.fileuuid}/${job.data._filename}-640.mp4`
      );
      file
        .pipe(
          bucketfile.createWriteStream({
            gzip: true,
            //destination does not work
            predefinedAcl: "publicRead",
          })
        )
        .on("finish", () => {
          compressed
            .pipe(
              compressedBucketfile.createWriteStream({
                gzip: true,
                //destination does not work
                predefinedAcl: "publicRead",
              })
            )
            .on("finish", () => {
              //delete local file and update db
              rimraf(path.join(tempdir, "views", job.data.fileuuid), () => {
                videoModel
                  .updateOne(
                    { _id: job.data._id },
                    {
                      $set: {
                        originalKey: `https://storage.googleapis.com/video21984/${
                          job.data.fileuuid + "/" + job.data._filename
                        }`,
                        key_360: `https://storage.googleapis.com/video21984/${
                          job.data.fileuuid +
                          "/" +
                          job.data._filename +
                          "-640.mp4"
                        }`,
                      },
                    }
                  )
                  .then((video) => {
                    console.log(video);
                    done();
                  });
              });
            });
        });
    })
    .run();
});
