const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const auth = require("../middleware/auth");
const {
  sendWelcomeEmail,
  sendCancellationEmail
} = require("../emails/account");

const router = new express.Router();

/*--------------------------------Users--------------------------------*/
// Commented code is left in for comparison against refactored syntax
//---------CREATE------------
// Create user
router.post("/users", async (req, res) => {
  // // Create User
  // const user = new User({
  //   name: "    Ian  ",
  //   email: "ilogan@example.com",
  //   password: "p4ssW0rd"
  // })

  const user = new User(req.body);

  // Save user
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    // send token so postman can parse it as authToken
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
  // user
  //   .save()
  //   .then(() => {
  //     res.status(201).send(user);
  //   })
  //   .catch(e => {
  //     res.status(400).send(e);
  //   });
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    // filter out token associated with current session and save doc to database
    req.user.tokens = req.user.tokens.filter(
      token => token.token !== req.token
    );
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

//---------READ------------
// Get users
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);

  // User.find({})
  //   .then(users => {
  //     res.send(users);
  //   })
  //   .catch(e => {
  //     res.status(500).send();
  //   });
});

//---------UPDATE------------
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid Updates" });
  }

  try {
    //req.params: the values entered after /users/[:params] | req.body: the object parsed from the sent JSON file
    //const user = await User.findById(req.params.id);

    updates.forEach(update => (req.user[update] = req.body[update]));
    await req.user.save();

    // // quicker way of updating but forgoes mongoose schema pre/post functions
    // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    //   new: true,
    //   runValidators: true
    // });

    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

//---------DELETE------------
router.delete("/users/me", auth, async (req, res) => {
  try {
    // const user = await User.findByIdAndDelete(req.user._id);
    // if (!user) {
    //   return res.status(404).send();
    // }
    await req.user.remove();
    sendCancellationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

/* File Uploading */
const upload = multer({
  limits: {
    fileSize: 1000000 // limit file size to 1MB
  },
  fileFilter(req, file, cb) {
    // Must be jpg, jpeg, or png
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload jpg, jpeg, or png"));
    }
    cb(undefined, true);
  }
});

// upload user avatar
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    // only possible when no dest set on multer upload
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// delete user avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }
    //key value pari
    res.set("Content-Type", "image/png"); //default is application/json
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
