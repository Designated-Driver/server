var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var braintree = require('braintree')
var router = express.Router()

var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: 'rhnyxxfd2wmyp5bn',
  publicKey: 'nsx79wwcjj5tbsnj',
  privateKey: '86fb4e22929a369781d9c4d59aded9f3'
})

// router.get('/card', function (req, res) {
//     gateway.clientToken.generate({}, function (err, response) {
//       res.render('/card', {clientToken: response.clientToken, messages: req.flash('error')});
//     });
//   });

// router.route ('/').get(function (req, res){
//   console.log('At home page')
//   // res.render('/src/main')
// })

router.route ('/card').get (function (req, res) {
  gateway.clientToken.generate({}, function (err, response) {
    console.log('at /card');
    res.render('/card', {clientToken: response.clientToken});
  });
});

router.route ('/checkout').post( function (req, res) {
  var nonce = req.body.paymentPayload
    
  gateway.transaction.sale({
    amount: '147.00',
    paymentMethodNonce: nonce,
    options: {
      submitForSettlement: true
    }
  }, function (err, result) {
    if (result.success || result.transaction) {
      console.log('Successful transaction')
    } else {
      res.status(500).send(err)
    }
  })
})

app.listen(process.env.PORT || 8081)
module.exports = router
