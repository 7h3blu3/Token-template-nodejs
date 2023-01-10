const crypto = require('crypto');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const sendgridTransport = require("nodemailer-sendgrid-transport")

const User = require("../models/user");

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: "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"
  }
})
)

exports.postUserSignUp = (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then((hash) => {
    const user = new User({
      email: req.body.email,
      password: hash,
    });
    user
      .save()
      .then((result) => {
        console.log(result)
        res.status(201).json({
          message: "User created!",
          result: result,
        });
        console.log(user);
      })
      .catch((err) => {
        console.log("creating a user error " + err);
        res.status(500).json({
          message: "A user with that email has already been created!",
        });
      });
  });
};

exports.postUserLogin = (req, res, next) => {
  let fetchedUser;
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          message: "Invalid authentication credentials!",
        });
      }
      fetchedUser = user;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then((result) => {
      if (!result) {
        return res.status(401).json({
          message: "Auth failed",
        });
      }
      const token = jwt.sign(
        {
          email: fetchedUser.email,
          userId: fetchedUser._id,
        },
        process.env.JWT_KEY,
        { expiresIn: "1h" }
      );
      res.status(200).json({
        token: token,
        expiresIn: 3600,
        userId: fetchedUser._id
      });
    })
    .catch((err) => {
      console.log("trying to login error " + err)
      return res.status(401).json({
        message: "Auth failed",
      });
    });
}

exports.postResetPassword = (req, res, next) => {
  var environment = req.body.env
  console.log("req ", req.body.email)
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.status(404).json({
        message: "Reset failed",
      });
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          return res.status(404).json({
            message: "No account with that email found.",
          });
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.status(200).json({
          message:"Email sent successfully."
        })
        transporter.sendMail({
          to: req.body.email,
          from: 'milen.krasimirov.deyanov@gmail.com',
          subject: 'Password reset',
          html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="${environment}/auth/new-password/${token}">link</a> to set a new password.</p>
          `
        });
      })
      .catch(err => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
        console.log(user)
        res.status(201).json({
          userId: user._id.toString(),
          passwordToken: token
        });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  if(!userId){
    return res.status(404).json({
      message: "The link for password reset was used or expired. Please request a new one."
    })
  }
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      console.log("result ", result)
      res.status(200).json({message:"Successfull reset"});
    })
    .catch(err => {
      console.log("err", err);
    });
};