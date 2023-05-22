var express= require("express")
var router=express.Router()

router.get('/msg', function(req, res, next) {
    res.render('msg', { title: 'Express' });
  });

module.exports=router;