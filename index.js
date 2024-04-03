import express, { json } from "express";
import jwt from "jsonwebtoken";
import cors from "cors"
import fs, { writeFile } from "fs"
import 'dotenv/config'

const app = express();
const port = 5724;
var secret = process.env.DB_SECRET;
app.use(json());

var whitelist = ['http://localhost:3000', CORS_WHITELIST]
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS at ' + new Date().toLocaleString()))
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
};

app.use(cors(corsOptions))

app.post("/auth", function (req, res) {
    const { authtype, username, password } = req.body;
    const token = jwt.sign(username, secret);

    fs.readFile("storage/users.json", 'utf8', function (err, data) {
        if (err)
            res.send(err);

        var db = JSON.parse(data);
        const match = db.users.filter(match => match.username === username)

        if (authtype === 'login') {
            if (match.length === 1) {
                if (match[0].password === password) {
                    res.send({ "auth": true, "token": token });
                }
                else {
                    res.send({ "auth": false });
                }
            }
        } else if (authtype === 'register') {
            if (match.length === 1) {
                res.send({ "auth": false })
            } else {
                var entry = {
                    "username": username,
                    "password": password
                }

                db['users'].push(entry)
                writeFile("storage/users.json", JSON.stringify(db, null, 2), function (err) {
                    if (err)
                        res.send(err);
                })
                res.send({ "auth": true, "token": token })
            }
        }
    })
})

app.post("/jwt", function (req, res) {
    const { token } = req.body
    if (jwt.verify(token, secret)) {
        res.send({ "auth": true, username: jwt.decode(token) })
    }
})

app.post("/newpost", function (req, res) {
    fs.writeFile("storage/posts.json", JSON.stringify(req.body, null, 2), "utf8", function (err) {
        if (err)
            res.send(err);
    });
    res.sendStatus(200);
})

app.post("/comment", function (req, res) {
    const { token, comment, postid } = req.body;

    if (jwt.verify(token, secret)) {
        fs.readFile("storage/posts.json", 'utf8', function (err, data) {
            if (err)
                res.send(err);

            var db = JSON.parse(data);

            var entry = {
                "author": jwt.decode(token),
                "content": comment
            }
            db.posts[postid].comments.push(entry)

            fs.writeFile("storage/posts.json", JSON.stringify(db, null, 2), "utf8", function (err) {
                if (err)
                    res.send(err);
            });
            res.sendStatus(200);
        })
    }
})

app.get("/posts", function (req, res) {
    fs.readFile("storage/posts.json", 'utf8', function (err, data) {
        if (err) res.send(err);
        var obj = JSON.parse(data);
        res.send(JSON.stringify(obj))
    });
})

app.listen(port, function () {
    console.log(`listening on port ${port}`)
});