console.log('at the server.js file')
const express = require('express')
const bodyParser = require('body-parser')
const logger = require('morgan')
const router = express.Router(); // eslint-disable-line new-cap
const braintree = require('braintree')
const cors = require('cors')
const app = express()

app.use(logger('dev'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors())

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

app.post('/checkout', (req, res) => {
    var gateway = braintree.connect({
        environment: braintree.Environment.Sandbox,
        merchantId: 'rhnyxxfd2wmyp5bn',
        publicKey: 'nsx79wwcjj5tbsnj',
        privateKey: '86fb4e22929a369781d9c4d59aded9f3'
    })
    var nonce = req.body.paymentPayload
    var total = req.body.amount

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
