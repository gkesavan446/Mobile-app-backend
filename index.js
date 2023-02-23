import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { auth } from './middleware/auth.js'
import * as dotenv from 'dotenv'
dotenv.config()

const app = express();

//connection
// const MONGO_URL = "mongodb://127.0.0.1";
const MONGO_URL = process.env.MONGO_URL;
const client = new MongoClient(MONGO_URL);// dail
await client.connect(); // call
console.log("Mongo is connected !!!");

const PORT = process.env.PORT;

app.use(express.json())
app.use(cors())

// const mobiles = [
//     {
//         model: "OnePlus 9 5G",
//         img: "https://m.media-amazon.com/images/I/61fy+u9uqPL._SX679_.jpg",
//         company: "Oneplus"
//     },
//     {
//         model: "Iphone 13 mini",
//         img:
//             "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-13-mini-blue-select-2021?wid=470&hei=556&fmt=jpeg&qlt=95&.v=1645572315986",
//         company: "Apple"
//     },
//     {
//         model: "Samsung s21 ultra",
//         img: "https://m.media-amazon.com/images/I/81kfA-GtWwL._SY606_.jpg",
//         company: "Samsung"
//     },
//     {
//         model: "Xiomi mi 11",
//         img: "https://m.media-amazon.com/images/I/51K4vNxMAhS._AC_SX522_.jpg",
//         company: "Xiomi"
//     }
// ];

app.get("/", async function (request, response) {
    response.send("🙋‍♂️, 🌏 🎊✨🤩");
});

app.get("/mobiles", auth, async function (request, response) {
    const data = request.params
    const result = await client.db("newmongo").collection("mobiles").find({}).toArray();
    response.send(result);

});

app.post("/mobiles", async function (request, response) {
    const data = request.body;
    console.log(data);
    //db.movies.insertMany({})
    const result = await client.db("newmongo").collection("mobiles").insertMany(data);
    response.send(result);

});

app.delete("/mobiles/:id", auth, async function (request, response) {
    const { id } = request.params;
    const { roleid } = request;
    if (roleid === "0") {
        const result = await client.db("newmongo").collection("mobiles").deleteOne({ _id: ObjectId(id) });
        console.log(result)
        result.deletedCount > 0
            ? response.send({ Message: "Mobile Deleted Successfully!!!" })
            : response.status(404).send({ Message: "Mobile Not Found" })
    } else {
        response.status(401).send({ Message: "Unauthorized!!!" })
    }
    //db.movies.insertMany({})


});

export async function getHashedPassword(password) {
    const no_of_rounds = 10;
    const salt = await bcrypt.genSalt(no_of_rounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    // console.log(salt);
    console.log(hashedPassword);
    return hashedPassword
}

export async function createUser(data) {
    return await client.db("newmongo").collection("users").insertOne(data);
}

export async function getUserByName(username) {
    return await client.db("newmongo").collection("users").findOne({ username: username });
}

app.post("/signup", async function (request, response) {
    const { username, password, roleid } = request.body;
    const userFromDB = await getUserByName(username)
    console.log(userFromDB)
    if (userFromDB) {
        response.status(400).send({ Message: "Username exits already!!!" })
    } else if (password.length < 8) {
        response.status(400).send({ Message: "your password must be atleast 8 Characters" })
    }
    else {
        const hashedPassword = await getHashedPassword(password);
        const result = await createUser({
            username: username,
            password: hashedPassword,
            roleid: roleid || "1"
        });
        response.send(result);
    }

});

app.post("/login", async function (request, response) {
    const { username, password } = request.body;
    const userFromDB = await getUserByName(username)
    console.log(userFromDB)
    if (!userFromDB) {
        response.status(400).send({ Message: "Invalid Credentials" })
    } else {
        const storedDBPassword = userFromDB.password
        const isPasswordCrct = await bcrypt.compare(password, storedDBPassword)
        console.log(isPasswordCrct)
        if (isPasswordCrct) {
            const token = jwt.sign({ id: userFromDB._id }, process.env.SECRET_KEY)
            response.send({ Message: "Successfully Logged in!!!", token: token, roleid: userFromDB.roleid })
        } else {
            response.status(400).send({ Message: "Invalid Credentials" })
        }
    }
});




app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));
