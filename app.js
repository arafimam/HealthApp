/**
 * Initiliaze all import statemets here.
 */
const express = require('express')
const app = express()
const ejs = require("ejs");
const bcrypt = require('bcryptjs')
const User = require("./models/user")
const Health = require("./models/health")
const jwt = require('jsonwebtoken')
const { createTokens, validateToken, getName } = require("./JWT");
const cookieParser = require('cookie-parser')
const Calorie = require("./models/calories")
const bodyParser = require('body-parser')
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser());

/**
 * All front end messages defined here.
 */
var underWeight = "Based on your height and weight you are current under-weight";
var overWeight = "Based on your height and weight you are currently over-weight";
var healthy = "You are healthy!";
var obese = "Based on your height and weight you are currently obese";
var calorieDeficit = "You have a calorie deficit compared to what you should eat.";
var calorieSurplus = "You have a calorie surplus compared to what you should eat.";

/**
 * Get request from home route.
 * Function just renders the index page.
 */
app.get("/",function(req,res){
    res.render("index")
})

/**
 * Get request from register route.
 */
app.get("/register",function(req,res){
    res.render("register")
})

/**
 * Get request from login route.
 */
app.get("/login",function(req,res){
    res.render("login")
})

/**
 * Get request from diet route.
 * The function checks user calorie database to check the required calorie and calorie intake and displays the correct message.
 */
app.get("/diet", validateToken, async function(req,res){
    var username = getName();
    const user = await Calorie.findOne({username}).lean();
    if (user.RequiredCalorie > user.calorieIntake){

    }
})

/**
 * Get request from profile route.
 * This function checks user bmi from the user health database and using the database 
 * it displays the correct message in the UI.
 */
app.get("/profile",validateToken,async function(req,res){
    var username = getName();
    const user = await Health.findOne({username}).lean()
    if (user.bmi < 18.5){
        res.render("profile",{bmi: user.bmi, message: underWeight});
    }
    else if (user.bmi>= 18.5 && user.bmi <= 24.9){
        res.render("profile",{bmi: user.bmi, message: healthy})
    }
    else if (user.bmi >25 && user.bmi < 29.9){
        res.render("profile",{bmi: user.bmi, message: overWeight})
    }
    else {
        res.render("profile",{bmi: user.bmi, message: obese})
    }
    //res.render("profile",{bmi: user.bmi, message: "None"});
})


/**
 * Post request from diet route.
 * This function calculates the user total calorie intake and also calculates the required calorie based on:
 * Source: https://www.livestrong.com/article/317684-how-many-calories-should-i-be-eating-for-my-height/
 */
app.post("/diet", async function(req,res){
    var breakfast = parseFloat(req.body.breakfastCal); 
    var lunch = parseFloat(req.body.lunchCal);
    var dinner = parseFloat(req.body.dinnerCal); 
    var other = parseFloat(req.body.otherCal);
    const totalCalorie = breakfast+lunch+dinner+other;
    console.log("Total calories : " + totalCalorie);
    
    // calculate the required calorie. 
    const username = getName();
    console.log("Username" + username);
    const user = await Health.findOne({username}).lean();
    console.log(user);
    if (user === null){
        res.redirect("/login");
    }
    var requiredCalorie = 0;
    if (user.gender === 'Male'){
        requiredCalorie =  (9.99 * user.weight) + (6.25* user.height) - (4.92* user.age) + 5;

    }else if (user.gender === 'Female' ){
        requiredCalorie =  (9.99 * user.weight) + (6.25* user.height) - (4.92* user.age) -161;
    }
    console.log(requiredCalorie);
    Calorie.findOneAndUpdate({username},{RequiredCalorie: requiredCalorie, calorieIntake: totalCalorie },(err,data) =>{
        if (err){
            console.log("calorie database not updated");
        }
        else{
            console.log("calorie database updated")
        }
    })
    res.redirect("/diet");
})

/**
 * Post requires from profile route.
 * This function calculates the user bmi and stores in the health database.
 */
app.post("/profile",async function(req,res){
    const height = parseFloat(req.body.height);
    const weight =  parseFloat(req.body.weight);
    const age = req.body.age;
    const gender = req.body.gender;
    var username= getName();
    const BMI = weight / (height*height);
    Health.findOneAndUpdate({username: username},{height: height,weight: weight,bmi: BMI,age: age,gender: gender},(err,data) => {
        if (err){
            console.log("Health db not updated");
        }
        else{
            console.log("Health db updated"); //gives the previous data.
        }
    });
    res.redirect("/profile")
})


/**
 * Post request from login route. 
 * checks if user exist in user database. If user does not exist sends correct message.
 */
app.post("/login", async function(req,res){
    const {username,password}=req.body;

    const user = await User.findOne({username}).lean()
    console.log(user);
    if (!user){
        // incorrect username or password --> need refactoring to show message in screen.
        console.log("incorrect username")
        return res.json({status: 'error',error:"Invalid username/password"});
        
    }
    
    if (await bcrypt.compare(password,user.password)){
        // the username password match to the one in db.
        const accessToken = createTokens(user);

      res.cookie("access-token", accessToken, {
        maxAge: 60 * 60 * 24 * 30 * 1000,
        httpOnly: true,
      });
       res.redirect("/profile")

    }
    else{
        return res.json({status: 'error',error:"Invalid username/password"});

    }
    
})


/**
 * Post request for register route. 
 * This function registers the user database and also initializes the other database.
 */
app.post("/register",async function(req,res){
    const {username, password: plainTextPassword} = req.body;
    
    const password = await bcrypt.hash(plainTextPassword,10)
    console.log("Hashed Password: "+ password);
    try{
        const response = await User.create({
            username,
            password
        })
        console.log("Registered user.")
        console.log(response);

        const healthData = await Health.create({
            username: username,
            bmi: 0, //default values
            height: 0,
            weight: 0,
            age: 0,
            gender: "Not Selected"
        })
        console.log("Printing health data.")
        console.log(healthData);

        const calorieData = await Calorie.create({
            username: username,
            RequiredCalorie: 0, // default values.
            calorieIntake: 0
        })

        console.log("Printing calorie data: ");
        console.log(calorieData);


        res.redirect("login")
    }catch(error){
        if (error.code === 11000){
            return(res.json({
                status: error,
                error: 'Username already exist'
            }))
        }
        throw error
    }
})


/**
 * Listens to port: 3000
 */

app.listen(3000,function(){
    console.log("Server is running in local build.");
})