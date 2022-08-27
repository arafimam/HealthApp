const express = require('express')
const app = express()
const ejs = require("ejs");
const bcrypt = require('bcryptjs')
const User = require("./models/user")
const Health = require("./models/health")
const jwt = require('jsonwebtoken')
const { createTokens, validateToken, getName } = require("./JWT");
const cookieParser = require('cookie-parser')
const {getCalorieNeeded} = require('./dietLogic');
const Calorie = require("./models/calories")


const bodyParser = require('body-parser')
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser());

var underWeight = "Based on your height and weight you are current under-weight";
var overWeight = "Based on your height and weight you are currently over-weight";
var healthy = "You are healthy!";
var obese = "Based on your height and weight you are currently obese";

app.get("/",function(req,res){
    res.render("index")
})
app.get("/register",function(req,res){
    res.render("register")
})

app.get("/login",function(req,res){
    res.render("login")
})
app.get("/diet", validateToken, function(req,res){
    res.render("diet");
})

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

app.post("/diet", async function(req,res){
    const totalCalorie =  req.body.breakfastCal + req.body.lunchCal + req.body.dinnerCal + req.body.otherCal;
    console.log("Total calories : " + totalCalorie);
    
    // calculate the required calorie. 
    const username = getName();
    const user = await Health.findOne({username}).lean();
    console.log(user);
    const RequiredCalorie = getCalorieNeeded(user.weight,user.height,user.age,user.gender);
    console.log(RequiredCalorie);
    Calorie.findOneAndUpdate({username},{RequiredCalorie: RequiredCalorie, calorieIntake: totalCalorie },(err,data) =>{
        if (err){
            console.log("calorie database not updated");
        }
        else{
            console.log("calorie database updated")
        }
    })


})

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

        const calorieData = await Calorie.create({
            username: username,
            RequiredCalorie: 0, // default values.
            calorieIntake: 0
        })

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



app.listen(3000,function(){
    console.log("Server is running in local build.");
})