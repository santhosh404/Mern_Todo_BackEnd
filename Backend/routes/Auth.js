const express = require('express')
const router = express.Router()
const usersSchema = require('../models/UsersModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
var nodemailer = require('nodemailer'); 



router.post("/register", async (req, res) => {

    const {firstName, lastName, email, password} = req.body
    const encyptedPassword = await bcrypt.hash(password, 10)

    try {
        const isOldUser = await usersSchema.findOne({email})
        if(isOldUser){
            return res.json("User already exists")
        }
            
        await usersSchema.create({
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: encyptedPassword
        })
            res.json({"status": "User created successfully"})
    }
    catch(err) {
        res.send({status: "error", error: err})
    }
})

router.post("/login", async (req, res) => {
    const {email, password} = req.body

    try {
        const isExists = await usersSchema.findOne({email})
        if(!isExists) return res.json({status: "Email ID not found"})

        if(await bcrypt.compare(password, isExists.password)) {
            const token = jwt.sign({id: isExists._id}, process.env.JWT_SECRET_KEY)
            if(res.status(201)) {
                return res.json({status: "Login successful", accessToken:token, userID: isExists._id})
            }
            else{
                return res.json({status: "error"})
            }
        }
        return res.json({status: "Invalid Password"})
    }
    catch(err) {
        res.send({status: "error", error: err})
    }
})


router.post("/userDetails", async (req, res) => {
    const {token} = req.body
    console.log(req.body);
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET_KEY)
        console.log(user);

        usersSchema.findOne({_id: user.id}).then((data) => {
            res.send({status: "ok", data:data})
        }).catch((err) => {
            res.send({status: "ok", error: err.message})
        })
    }
    catch(err){
        res.send({status: "error", error: err.message})
    }
})

router.post("/forgot-password", async (req, res) => {
    const {email} = req.body
    
    const oldUser = await usersSchema.findOne({email: email})
    console.log(oldUser)
    if(!oldUser) return res.json({status: "Email ID not found"}) 
        const secret = process.env.JWT_SECRET_KEY+oldUser.password
        console.log("one",secret);
        try {
            token = jwt.sign({id: oldUser._id, id:oldUser._id}, secret)
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'santhoshjit31@gmail.com',
                  pass: 'jqrewoxvibgtmoec'
                }
              });
              
              var mailOptions = {
                from: 'no-reply@gmail.com',
                to: email,
                subject: 'ATODO - Reset your Password',
                html: `<div><h1>Reset Your Password.</h1> <p>Please find the attached link and change your password by clicking the link!. Go ahead</p><br />https://merntask-d91q.onrender.com/users/reset-password/${oldUser._id}/${token}</div>` 
            };
              
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error)
                    res.json({ status: error})
                } else {
                    res.json({ status: "ok"})
                //console.log('Email sent: ' + info.response);
                }
              });
        }
        catch(err) {
            res.json({status: err})
        }
})

router.get("/reset-password/:id/:token", async (req, res) => {
    const {id, token} = req.params;
    console.log(id, token, req.params);
    const oldUser = await usersSchema.findOne({_id:id})
    console.log(oldUser);
    if(!oldUser) return res.json({status: "Email ID not found"}) 
    const secret = process.env.JWT_SECRET_KEY+oldUser.password
    console.log("two",secret);
        try {
            const verifyToken = jwt.verify(token, secret)
            res.json({status: "ok"})
        }
        catch(err) {
            res.json({status: err.message})
        }
})

router.patch("/reset-password/:id/:token", async (req, res) => {
    const {id, token} = req.params;
    const {password} = req.body;

    console.log(password);
    const oldUser = await usersSchema.findOne({_id: id})
    if(!oldUser) return res.json({status: "User not found"}) 
    const secret = process.env.JWT_SECRET_KEY+oldUser.password
        try {
            const verifyToken = jwt.verify(token, secret)
            const encyptedPassword = await bcrypt.hash(password, 10) 
            await usersSchema.updateOne({ _id: id }, { $set: { password: encyptedPassword } })
            res.json({status: "ok", message: "Password changes Successfully"})
        }
        catch(err) {
            res.json({status: err.message})
        }
})

module.exports = router;