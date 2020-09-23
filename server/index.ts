import fs from "fs";

import express from "express";
import child_process from "child_process";

import cors from "cors";
import bodyParser from "body-parser";

// Create a new express application instance
const app: express.Application = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.get("/log/", function(req, res) {
  console.log("Log");
  res.sendFile("/log.html", {root: "hovalaag"});
});

const Problems: {[id: string]: string} = {};
app.get("/:problem/", function(req, res) {
  if (req.params.problem in Problems)
    res.send(Problems[req.params.problem]);
  else {
    child_process.exec(
        `cd ./hovalaag/ && hoval.exe ${req.params.problem}`, (error, stdout, stderr) => {
          if (error) {
            res.send(`error: ${error.message}`);
            return;
          }
          if (stderr) {
            res.send(`stderr: ${stderr}`);
            return;
          }
          res.send(stdout);
          Problems[req.params.problem] = stdout;
        });
  }
});

app.post("/:problem/", function(req, res) {
  const filename = `vasm/${req.ip.replace(/[^\w\s]/gi, '')}.vasm`;
  fs.writeFile(`./hovalaag/${filename}`, req.body.vasm, () => {
    child_process.exec(
        `cd ./hovalaag/ && hoval.exe ${req.params.problem} ${filename}`,
        (error, stdout, stderr) => {
          res.json({
            error: error ? error.message : null,
            stderr: stderr,
            stdout: stdout
          });
        });
  });
});

app.post("/logs/:problem/", function(req, res) {
  const filename = `vasm/${req.ip.replace(/[^\w\s]/gi, '')}.vasm`;
  fs.writeFile(`./hovalaag/${filename}`, req.body.vasm, () => {
    child_process.exec(
        `cd ./hovalaag/ && hoval.exe ${req.params.problem} -t 1 -c ${filename}`,
        (error, stdout, stderr) => {
          /*
                    if (error) {
                      res.send(`error: ${error.message}`);
                      return;
                    }
                    if (stderr) {
                      res.send(`stderr: ${stderr}`);
                      return;
                    }
                            res.send(stdout);
                */
          res.json({
            error: error ? error.message : null,
            stderr: stderr,
            stdout: stdout
          });
        });
  });
});

app.get("/", function(req, res) {
  child_process.exec(`cd ./hovalaag/ && hoval.exe`, (error, stdout, stderr) => {
    if (error) {
      res.send(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      res.send(`stderr: ${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

const Port = 3001;
app.listen(Port, function() { console.log(`Listening on port ${Port}...`); });