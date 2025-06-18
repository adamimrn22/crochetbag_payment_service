const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(require("./src/routes"));

app.get("/", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.info(`server up on port ${PORT}`);
// });

module.exports = app;
