#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var async = require('async');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var makeReadChecks = function(checksFile) {
  return function(callback){
    fs.readFile(checksFile, function(err, data){
      if (err) throw err;
      callback(null, JSON.parse(data))
    });
  };
}

var makeReadHtml = function(file, url) {
  return function(callback){
    if (file) {
      fs.readFile(file, function(err, data){
        if (err) throw err;
        callback(null, cheerio.load(data));
      });
    } else if (url) {
      restler.get(url).on('complete', function(data) {
        callback(null, cheerio.load(data));
      })
    } else {
      callback('either --file or --url must be specified', null);
    }
  }
}

var checkHtml = function($, checks) {
  var out = {};
  for(var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
}

var outputResults = function(err, results) {
  if (err) throw err;
  var checkJson = checkHtml(results.html, results.checks);
  var outJson = JSON.stringify(checkJson, null, 4);
  console.log(outJson);
}

if(require.main == module) {
    program
        .option('-c, --checks <checks>', 'Path to checks.json', assertFileExists, CHECKSFILE_DEFAULT)
        .option('-f, --file <file>', 'Path to index.html')
        .option('-u, --url <url>', 'url to validate')
        .parse(process.argv);
    async.parallel({
      checks: makeReadChecks(program.checks),
      html: makeReadHtml(program.file, program.url)
    },

    outputResults
    );
} else {
    //exports.checkHtmlFile = checkHtmlFile;
}
