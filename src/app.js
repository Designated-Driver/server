console.log('at the server.js file')
const express = require('express')
const bodyParser = require('body-parser')
const logger = require('morgan')
const router = express.Router(); // eslint-disable-line new-cap
const braintree = require('braintree')
const cors = require('cors')
const app = express()
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

app.get('/getClientId', (req, res) => {
    var gateway = braintree.connect({
        environment: braintree.Environment.Sandbox,
        merchantId: 'rhnyxxfd2wmyp5bn',
        publicKey: 'nsx79wwcjj5tbsnj',
        privateKey: '86fb4e22929a369781d9c4d59aded9f3'
    })

    gateway.clientToken.generate({},function (err, response) {
        res.send(response.clientToken)
        // console.log(response.clientToken)
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
    var gateway = braintree.connect({
        environment: braintree.Environment.Sandbox,
        merchantId: 'rhnyxxfd2wmyp5bn',
        publicKey: 'nsx79wwcjj5tbsnj',
        privateKey: '86fb4e22929a369781d9c4d59aded9f3'
    })
    var nonce = req.body.paymentPayload
    var total = req.body.cost

    console.log(nonce)
    var newTransaction = gateway.transaction.sale({
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true
        }
    }, function (err, result) {
            if(result.success || result.transaction){
                res.send(result)
            } else {
                res.status(500).send(err)
            }
    })
})

app.listen(process.env.PORT || 8081)
