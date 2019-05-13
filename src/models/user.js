const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Task = require("./task");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      }
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number");
        }
      }
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password cannot contain 'password'");
        }
      }
    },
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ],
    avatar: {
      type: Buffer
    }
  },
  {
    timestamps: true
  }
);

//creates virtual field on users that is not actually in database
userSchema.virtual("tasks", {
  // the Model we're referencing
  ref: "Task",
  // compare "User: _id" to "Task: owner" to see if they are the same
  // if so create relationship
  localField: "_id",
  foreignField: "owner"
});

/* Methods indicates methods available on the instance of a model
---------------------"instance methods"---------------------*/
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  // create token with user _id embedded within it (LOOK THIS UP)
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  // save token to database as a field on user
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  delete userObject.tokens;
  delete userObject.password;
  delete userObject.avatar;

  return userObject;
};

/* Static indicates methods available on the model
---------------------"model methods"---------------------*/
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  // check if user with email exists in database
  if (!user) {
    throw new Error("Unable to login");
  }

  // check if plaintext and hashed password are the same
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login");
  }

  return user;
};
/* Use Pre to perform function before some action e.g. save */
// Hash the plain text password before saving
userSchema.pre("save", async function(next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// Delete user tasks when user is removed
userSchema.pre("remove", async function(next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

// Define model
const User = mongoose.model("User", userSchema);

module.exports = User;
