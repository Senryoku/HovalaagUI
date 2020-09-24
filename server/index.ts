import fs from "fs";

import express from "express";
import child_process from "child_process";

import cors from "cors";
import bodyParser from "body-parser";

const MaxCycles = 500000;
const Wine = process.platform === "win32" ? "" : "wine ";

// Create a new express application instance
const app: express.Application = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Request<ParamsDictionary, any, any, QueryString.ParsedQs> ?
function getPersonalDir(req: any) {
  const uid = req.params.uid;  // req.ip.replace(/[^\w\s]/gi, '');
  const personalDir = `./user_data/${uid}`;
  if (!fs.existsSync(personalDir)) fs.mkdirSync(personalDir);
  return personalDir;
}

app.get("/instructions", function(req, res) {
  res.sendFile("./hovalaag/sample.vasm", {root: "."});
});

app.get("/log/:uid", function(req, res) {
  const personalDir = getPersonalDir(req);
  res.sendFile("/log.html", {root: personalDir});
});

let Leaderboard: {[id: string]: any} = {};
if (fs.existsSync('data/leaderboard.json')) {
  Leaderboard = JSON.parse(fs.readFileSync('data/leaderboard.json').toString());
}

app.get("/leaderboard", function(req, res) { res.json(Leaderboard); });

app.post("/submit/:uid/:problem/", function(req, res) {
  const problem = req.params.problem;
  const uid = req.params.uid.substr(0, 256);
  if (!["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]
           .includes(problem)) {
    res.json({error: "Invalid problem"});
    return;
  }

  const personalDir = getPersonalDir(req);
  const filename = `${problem}.vasm`;

  fs.writeFile(`${personalDir}/${filename}`, req.body.vasm, () => {
    child_process.exec(
        `cd ${personalDir} && ${Wine} "../../hovalaag/hoval.exe" ${problem} -m ${MaxCycles} ./${filename}`,
        (error, stdout, stderr) => {
          if (error) console.error(error);
          if (stdout.includes("SUCCESSFUL COMPLETION")) {
            const match =
                stdout.match(/: *([\d.]+) cycles - ([\d.]+) instructions/);
            if (match) {
              const score = {
                cycles: parseFloat(match[1]),
                instructions: parseInt(match[2])
              };
              if (!(problem in Leaderboard)) Leaderboard[problem] = {};

              if (uid in Leaderboard[problem]) {
                score.cycles =
                    Math.min(score.cycles, Leaderboard[problem][uid].cycles);
                score.instructions = Math.min(
                    score.cycles, Leaderboard[problem][uid].instructions);
              }
              Leaderboard[problem][uid] = score;
              fs.writeFileSync(
                  "data/leaderboard.json", JSON.stringify(Leaderboard));
            }
          }
          res.json({
            error: error ? error.message : null,
            stderr: stderr,
            stdout: stdout
          });
        });
  });
});

app.post("/trace/:uid/:problem/", function(req, res) {
  const problem = req.params.problem;
  if (!["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]
           .includes(problem)) {
    res.json({error: "Invalid problem"});
    return;
  }

  const personalDir = getPersonalDir(req);
  const filename = `${problem}.vasm`;

  // Create personal directory if needed

  // Write VASM file to disk
  fs.writeFile(`${personalDir}/${filename}`, req.body.vasm, (err) => {
    if (err) console.log(err);
    // Execute program
    child_process.exec(
        `cd ${personalDir} && ${Wine} "../../hovalaag/hoval.exe" ${problem} -t 1 -c -m ${MaxCycles} ./${filename}`,
        (error, stdout, stderr) => {
          if (error) console.error(error);
          res.json({
            error: error ? error.message : null,
            stderr: stderr,
            stdout: stdout
          });
        });
  });
});

const Problems: {[id: string]: string} = {};
app.get("/:problem/", function(req, res) {
  if (req.params.problem in Problems)
    res.send(Problems[req.params.problem]);
  else {
    child_process.exec(
        `cd ./hovalaag/ && ${Wine} hoval.exe ${req.params.problem}`,
        (error, stdout, stderr) => {
          if (error) console.error(`error: ${error.message}`);
          if (stderr) console.error(`stderr: ${stderr}`);
          res.send(stdout);
          Problems[req.params.problem] = stdout;
        });
  }
});

app.post("/:uid/:problem/", function(req, res) {
  const problem = req.params.problem;
  if (!["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]
           .includes(problem)) {
    res.json({error: "Invalid problem"});
    return;
  }

  const personalDir = getPersonalDir(req);
  const filename = `${problem}.vasm`;

  fs.writeFile(`${personalDir}/${filename}`, req.body.vasm, () => {
    child_process.exec(
        `cd ${personalDir} && ${Wine} "../../hovalaag/hoval.exe" ${problem} -m ${MaxCycles} ./${filename}`,
        (error, stdout, stderr) => {
          if (error) console.error(error);
          res.json({
            error: error ? error.message : null,
            stderr: stderr,
            stdout: stdout
          });
        });
  });
});

let HovalaagInstructions = "";
child_process.exec(`cd ./hovalaag/ && ${Wine} hoval.exe`, (error, stdout, stderr) => {
  if (error) console.error(`error: ${error.message}`);
  if (stderr) console.error(`stderr: ${stderr}`);
  HovalaagInstructions = stdout;
});

app.get("/", function(req, res) { res.send(HovalaagInstructions); });

const Port = 3001;
app.listen(Port, function() { console.log(`Listening on port ${Port}...`); });