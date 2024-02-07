const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const ejs = require('ejs');

const app = express();

// Database connection
mongoose.connect('mongodb://localhost:27017/products');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'mysecretkey', resave: true, saveUninitialized: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const User = mongoose.model('User', new mongoose.Schema({
  email: String,
  password: String,
  name: String,
}, { collection: 'users' }));


app.get('/', (req, res) => {
  if (req.session.userId) {
    
    res.redirect('/profile');
  } else {
    
    res.redirect('/login');
  }
});

app.get('/profile', (req, res) => {
  if (req.session.userId) {
    res.send(`<div style="background-color: aquamarine;width: 350px;padding-left: 150px; margin: auto; height: 170px; margin-top: 100px;border-radius: 15px;box-shadow: 0px 0px 30px;">
    <h1 style="margin-left:20px;">Hello ${req.session.userName}</h1>
    <p style=" font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;margin-left:20px;">
    Email: ${req.session.email}</p>

    <button style="border: none;border-radius: 3px;height: 20px;background-color: rgb(157, 187, 177);"><a href="/edit-profile" style="text-decoration: none;">Edit Profile</a></button>
    <button style="border: none;border-radius: 3px;height: 20px;background-color: rgb(157, 187, 177);"><a href="/delete-profile"  style="text-decoration: none;">Delete Profile</a></button>
    <button style="border: none;border-radius: 3px;height: 20px;background-color: rgb(157, 187, 177);"> <a href="/logout"  style="text-decoration: none;">Logout</a></button></div>`);
  } else {
    res.redirect('/');
  }
});


app.get('/login', (req, res) => {
  if(req.session.userId){
    
    res.redirect('/profile');
      
  }else{
  res.render('login', { errorMessage: req.query.errorMessage });
  }

});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.email = user.email; 
    res.redirect('/profile');
  } else {
    res.redirect('/login?errorMessage=Invalid email or password pls sign');
  }
});


app.get('/signup', (req, res) => {
  res.render('signup', { signupSuccessful: false});
});

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email,password});

  if (existingUser) {
    res.send('User already exists!');
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
  });

  await newUser.save();

 
  req.session.userId = newUser._id;
  req.session.userName = newUser.name;
  req.session.email = newUser.email; 


  res.redirect('/profile');
});



app.get('/edit-profile', (req, res) => {
  if (req.session.userId) {
    res.render('edit-profile', { userName: req.session.userName, email: req.session.email });
  } else {
    res.redirect('/');
  }
});

app.post('/edit-profile', async (req, res) => {
  const { name, email } = req.body;

  if (req.session.userId) {
    await User.findByIdAndUpdate(req.session.userId, { name, email }); 
    req.session.userName = name;
    req.session.email = email; 
    res.redirect('/profile');
  } else {
    res.redirect('/');
  }
});



app.get('/delete-profile', async (req, res) => {
  if (req.session.userId) {
    await User.findByIdAndDelete(req.session.userId);
    req.session.destroy();
    res.redirect('/');
  } else {
    res.redirect('/');
  }
});


app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});





