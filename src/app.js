console.log('at the server.js file')
const express = require('express')
const bodyParser = require('body-parser')
const logger = require('morgan')
const router = express.Router(); // eslint-disable-line new-cap
const braintree = require('braintree')
const gateway = require('../lib/gateway')
const cors = require('cors')
const app = express()
var newCustomer = null
const admin = require('firebase-admin')
var serviceAccount = require('./service.json')

app.use(logger('dev'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors())

var config = {
    apiKey: "AIzaSyCNtTlfQ0rbHqcrKCCuOJL9l8AuzPXx_58",
    credential: admin.credential.cert(serviceAccount),
    authDomain: "designated-driv.firebaseapp.com",
    databaseURL: "https://designated-driv.firebaseio.com",
    projectId: "designated-driv",
    storageBucket: "designated-driv.appspot.com",
    messagingSenderId: "427262799693"
  };
admin.initializeApp(config);

app.post('/createCustomerId', (req, res) => {
    var nonce = req.body.paymentPayload
    gateway.customer.create({
        paymentMethodNonce: nonce,
        creditCard: {
            options: {
                verifyCard: true
            }        
        }
    }, function(err, result) {
        if(result.success) {
            newCustomer = result.customer.id
            console.log(newCustomer)
            res.send(newCustomer)
        } else {
            res.status(500).send(err)
        }
    })
})

app.get('/getClientId', (req, res) => {
    gateway.clientToken.generate({
        customerId: newCustomer
    },function (err, response) {
        console.log(newCustomer)
        res.send(response.clientToken)
    })
})

app.get('/requestDrivers', (req, res) => {
    admin.database().ref('users/online/currentlyIdle').once('value').then(snapshot => {
        var newArray = Object.values(snapshot.val())
        var filteredArray = []
        var message = {
            notification: {
              title: 'Ride Requested',
              body: 'Would you like to respond to this ride?',
              click_action: "/",
              icon: 'https://raw.githubusercontent.com/Designated-Driver/client/master/static/img/icons/msapplication-icon-144x144.png',
            }
        };
        newArray.forEach(element => {
            if(element.accountType==='driver' && element.messageToken) {
                admin.messaging().sendToDevice(element.messageToken, message).then((response) => {
                    return res.send(response)
                }).catch((err) => {
                    console.log(err)
                })
            }
        })
    })
})

app.get('/acceptRide', (req, res) => {
    admin.database().ref('rides').once('value').then(snapshot => {
        var newArray = Object.values(snapshot.val())
        var message = {
            notification: {
              title: 'Driver Accepted',
              body: 'Join drivers discord chat room',
              click_action: "https://discord.gg/RVYgfwN",
              icon: 'https://raw.githubusercontent.com/Designated-Driver/client/master/static/img/icons/msapplication-icon-144x144.png',
            }
        };
        newArray.forEach(element => {
            if(element.messageToken) {
                admin.messaging().sendToDevice(element.messageToken, message).then((response) => {
                    return res.send(response)
                }).catch((err) => {
                    console.log(err)
                })
            }
        })
    })
})

app.post('/checkout', (req, res) => {
    var nonce = req.body.paymentPayload
    var total = req.body.amount

    console.log(nonce)
    gateway.transaction.sale({
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true
        }
    }, function (err, result) {
            if(result.success || result.transaction){
                // console.log(result.transaction.creditCard.last4)
                res.send(result.transaction.creditCard.last4)
            } else {
                res.status(500).send(err)
            }
    })
})

app.listen(process.env.PORT || 8081)
