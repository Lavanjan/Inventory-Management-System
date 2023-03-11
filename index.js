import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";

import UserRoute from "./src/routes/user.js";

const app = express();
const server = http.createServer(app);

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

dotenv.config();
const PORT = process.env.PORT;
const CONNECTION = process.env.MONGO_URI;

mongoose
  .connect(CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() =>
    server.listen(PORT, () => console.log(`Listening at Port ${PORT}`))
  )
  .catch((error) => console.log(`${error} did not connect`));

app.use("/user", UserRoute);
