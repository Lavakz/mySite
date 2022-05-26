var express = require('express');
var router = express.Router();

/* GET SpaceGame page. */
router.get('/', (req, res) => {
  res.render('SpaceRace', { title: 'Hey', message: 'Hello there!' })
})

module.exports = router;
