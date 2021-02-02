const ffmpeg = require("fluent-ffmpeg");

ffmpeg()
    .input(".\\views\\4d30c5c5fc38529f\\grb_2.mp4")
    .videoCodec("libx264")
    .videoBitrate("1000")
    .size("640x?")
    .format("mp4")
    // .pipe(
    //   bucketfile.createWriteStream({
    //     gzip: true,
    //     predefinedAcl: "publicRead",
    //   })
    // )
    .output("./out.mp4").run()

// var ffmpeg = require('fluent-ffmpeg');
/**
 *    input - string, path of input file
 *    output - string, path of output file
 *    callback - function, node-style callback fn (error, result)        
 */
// function convert(input, output, callback) {
//     ffmpeg(input)
//         .output(output)
//         .on('end', function() {                    
//             console.log('conversion ended');
//             callback(null);
//         }).on('error', function(err){
//             console.log('error: ', e.code, e.msg);
//             callback(err);
//         }).run();
// }

// convert('./sample_1280x720.mp4', './output.mp4', function(err){
//    if(!err) {
//        console.log('conversion complete');
//        //...

//    }
// });
