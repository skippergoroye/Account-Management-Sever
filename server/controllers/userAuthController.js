const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Verification = require("../models/verificationModel");
const { sendVerificationEmail } = require("../services/email");

const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });
};


// new
const userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        status_code: 401,
        status: "error",
        message: "Incorrect Email",
      });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        status_code: 401,
        status: "error",
        message: "Account has not been verified",
      });
    }

    // Check if the user is blocked
    if (user.blocked) {
      return res.status(401).json({
        status_code: 401,
        status: "error",
        message: "Your account has been blocked. Please contact support for assistance.",
      });
    }

    // Check if the password matches
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        status_code: 401,
        status: "error",
        message: "Incorrect Password",
      });
    }

    // Generate OTP if needed (for 2FA or some other functionality)
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Handle OTP creation or update to prevent MongoServerError: E11000 (duplicate key error)
    try {
      // Try creating a new OTP entry
      await Verification.create({ email, otp });
    } catch (err) {
      if (err.code === 11000) {
        // If the OTP entry already exists, update the OTP
        await Verification.updateOne(
          { email },
          { $set: { otp } }
        );
      } else {
        // For any other errors, throw them
        throw err;
      }
    }

    // Optionally send the OTP (e.g., for two-factor authentication)
    // await sendOtpToUser(email, otp);

    // Generate an access token
    const role = user.role || "user"; 
    const accessToken = generateAccessToken(user._id, role);

    // Respond with success
    res.status(200).json({
      status_code: 200,
      status: "success",
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          isVerified: user.isVerified
        },
        accessToken
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status_code: 500,
      status: "error",
      message: "Internal Server Error",
    });
  }
};





const userRegister = async (req, res) => {
  const { firstName, lastName, email, password, phoneNumber } = req.body;

  try {
    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status_code: 400,
        status: "error",
        message: "User already exists",
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hash,
      phoneNumber,
      isVerified: false,
    });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Create verification record and handle duplicate key error for email
    try {
      await Verification.create({ email, otp });
    } catch (err) {
      if (err.code === 11000) {
        // If the OTP record already exists for this email, update it instead
        await Verification.updateOne(
          { email },
          { $set: { otp } }
        );
      } else {
        // For other errors, throw them
        throw err;
      }
    }

    // Set OTP expiration (15 minutes) using a TTL mechanism in MongoDB
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Use setTimeout to delete OTP after expiration if you still want to use this method
    setTimeout(async () => {
      await Verification.findOneAndDelete({ email });
    }, otpExpiresAt - Date.now());

    // Send verification email
    await sendVerificationEmail(email, otp);

    // Generate access token
    const role = newUser.role || "user";
    const accessToken = generateAccessToken(newUser._id, role);

    // Respond with success
    res.status(201).json({
      status_code: 201,
      status: "success",
      message: "User registered successfully. Verification email sent.",
      data: {
        user: {
          _id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          isVerified: newUser.isVerified,
        },
        accessToken,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status_code: 500,
      status: "error",
      message: "Internal Server Error",
    });
  }
};


module.exports = {
  userLogin,
  userRegister,
};
