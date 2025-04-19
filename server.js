const express = require('express')
const cors = require('cors');
const user = require('./router/user');
const product = require('./router/product')
const cart = require('./router/cart')
const config = require('config')
const notification = require('./router/notification');
const wallet = require('./router/wallet');
const ratingRoute = require('./router/rating');

const connectDB = require('./config/connectDB')
// import config from 'config'

const PORT = config.get('PORT')
// njibou PORT mn fichier config

const app = express()
// declaration de la variable app et importation de express

app.use(cors());

app.use(express.json())
// utilisation de express.json

connectDB()
// connectDB()

const userPORT = PORT || 5000
// declaration de la variable port et affectation de la valeur 5000

// -------------- REQUEST CATEGORIES --------------
app.use("/user", user);
app.use('/product', product);
app.use('/cart', cart);
app.use('/notifications', notification);
app.use('/wallet', wallet);
app.use('/ratings', ratingRoute);

app.listen(userPORT, (err) => err ? console.log(err) :
    console.log(`Example app listening on port ${userPORT}!`)
)