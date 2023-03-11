import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.js";

export const register = async (req, res) => {
  const { username } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(req.body.password, salt);
  req.body.password = hashedPass;
  const payload = {
    username: req.body.username,
    password: req.body.password,
  };
  const newUser = new UserModel(payload);
  try {
    const isExist = await UserModel.findOne({ username });
    if (isExist)
      return res.status(400).json({ message: "User already exists" });
    const user = await newUser.save();
    const token = jwt.sign({ email: user.email, id: user._id }, "qwerty");
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await UserModel.findOne({ username: username });

    if (user) {
      const validity = await bcrypt.compare(password, user.password);

      if (!validity) {
        res.status(400).json("Incorrect Password");
      } else {
        const token = jwt.sign(
          { username: user.username, id: user._id },
          "qwerty"
        );
        res.status(200).json({ user, token });
      }
    } else {
      res.status(404).json("User not found");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
