const express = require("express");
const bodyParser =require("body-parser");
const pg = require("pg");

const app = express();
const satelize=require('satelize');

const geolocation = require('node-geolocation');
const countryData = require('country-data');


const port = 3000;



const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "root@123",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Yashaswini", color: "teal" },
  { id: 2, name: "Devi", color: "powderblue" },
];

async function checkVisisted() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1; ",
    [currentUserId]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users.find((user) => user.id == currentUserId);
}



app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUser = await getCurrentUser();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });

});





app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser = await getCurrentUser();


  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    const country_data=countryData.countries[countryCode];
  console.log(country_data);
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",
        [countryCode,currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
  

});



app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
    [name, color]
  );

  const id = result.rows[0].id;
  currentUserId = id;

  res.redirect("/");
});


// Handle POST requests
app.post('/loctracker', async(req, res) => {
  
satelize.satelize({ip:'102.165.25.0'},async function (err,payload){
console.log(payload);
const currentUser = await getCurrentUser();


  try {
   

    
    const countryCode = payload.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",
        [countryCode,currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
  timezone=payload.timezone;
  longitude=payload.longitude;
  latitude=payload.latitude;
  await db.query(
    "INSERT INTO countryinfo (timezone,longitude,latitude) VALUES ($1,$2,$3)",
    [timezone,longitude,latitude]
  );
    

});


});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
