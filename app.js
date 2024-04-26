require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const encrypt = require('mongoose-encryption');
const bcrypt = require('bcrypt');




const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

var cookieParser = require('cookie-parser')
app.use(cookieParser())

let saltRounds = 10;


mongoose.connect("mongodb://localhost:27017", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    voterName: String,
    gender: String,
    dob: Date,
    adhaarNo: Number,
    voterId: Number

});

//userSchema.plugin(encrypt, {secret: process.env.SECRET_KEY, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

// Define variables to store the number of votes for each party
let votesBJP = 0;
let votesBSP = 0;
let votesPWP = 0;
let votesSIK = 0;
let votesTRS = 0;
let winningParty = "";
let maxVotes = 0;

// Route handler for processing the form submission
app.post("/result", function(req, res) {
  // Get the selected party from the form
  const selectedParty = req.body.party;

  // Increment the respective vote count variable based on the selected party
  switch (selectedParty) {
    case "BJP":
      votesBJP++;
      break;
    case "BSP":
      votesBSP++;
      break;
    case "PWP":
      votesPWP++;
      break;
    case "SIK":
      votesSIK++;
      break;
    case "TRS":
      votesTRS++;
      break;
    default:
      console.log("Invalid party selection");
  }

  // Find the party with the most votes
  
  const parties = ["BJP", "BSP", "PWP", "SIK", "TRS"];

  for (const party of parties) {
    const votes = eval("votes" + party);
    if (votes > maxVotes) {
      maxVotes = votes;
      winningParty = party;
    }
  }

  // Log the current votes for debugging
  console.log(
    "Current votes - BJP:",
    votesBJP,
    "BSP:",
    votesBSP,
    "PWP:",
    votesPWP,
    "SIK:",
    votesSIK,
    "TRS:",
    votesTRS,
    "Winning:",
    winningParty,
    "Votes:",
    maxVotes
  );

  // Render the result page with the winning party information
  res.render("result", { winningParty });
});

app.get("/", function(req, res){
    res.render("home");
    console.log("User signed");
});

app.get("/login", function(req, res){
    res.render("login", {validation: "normal"});
});

app.get("/register", function(req, res){
    res.render("register");
});


app.post("/result", function(req, res){
    res.render("result");
});


app.get('/', function (req, res) {
    // Cookies that have not been signed
    console.log('Cookies: ', req.cookies)
  
    // Cookies that have been signed
    console.log('Signed Cookies: ', req.signedCookies)
  })


app.get("/results", function(req, res) {
    // Logic to determine winningParty (e.g., accessing a global variable or function)
    let winningParty1 = winningParty;
    let maxVotes1=maxVotes; // Replace with actual logic to get the winning party
  
    // Construct the HTML content with the winning party information (if available)
    let htmlContent = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Result</title>
  </head>
  <body>
  <h1 style="text-align: center;">Result</h1>`;
  
    // Check if winningParty is available and display appropriate message
    if (winningParty1) {
      htmlContent += `<p style="text-align: center;">The winning party is: ${winningParty1} with : ${maxVotes1} votes</p>`;
    } else {
      htmlContent += `<p style="text-align: center;">No votes have been cast yet, or the winning party hasn't been determined yet.</p>`;
    }
  
    htmlContent += `</body>
  </html>`;
  
    // Send the constructed HTML content as the response
    res.send(htmlContent);
  });
  


app.post("/register", function(req, res){
    const email = req.body.email; 
    const password = req.body.newPassword;    

    bcrypt.hash(password, saltRounds, function(err, passwordHash){        
        new User({
            email: email,
            password: passwordHash,
            voterName: req.body.voterName,
            gender: req.body.gender,
            dob: req.body.dob,
            adhaarNo: req.body.adhaarNo,
            voterId: req.body.voterId,
        }).save();
    });

    console.log("Registered New User");
    res.render("submit");

});

app.post("/login", function(req, res){
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({email: email}, function(err, foundUser){
        if(foundUser==null){
            console.log("User Doesn't Exist");
            res.render("login", {validation: "nouser"});
        }
        else{
            bcrypt.compare(password, foundUser.password, function(err, result){
                if (result === true){
                    console.log("User LoggedIn");
                    res.render("submit");
                }
                else {
                    console.log("Wrong Password");
                    res.render("login", {validation: "wrong"});
                }
            });
        }   
    });
});


let port = process.env.PORT;
if(port == null || port == "")
    port = 3000;


app.listen(port, function(){
    console.log("listening on port "+port);
});


