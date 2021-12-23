const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {})
const { count } = require('console');
const cookieParser = require("cookie-parser");
const sessions = require('express-session')
const { v4: uuidv4 } = require('uuid')

const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}))

// cookie parser middleware
app.use(cookieParser());

var session;
var users = new Set();

app.get("/", (req, res) => {
    session = req.session;
    if (req.session.userid) {
        res.sendFile(__dirname + "/index.html")
    } else {
        res.redirect("/login")
    }
    req.sessionStore.all((err, sessions) => {
        for (const key in sessions) {
            console.log(req.session.userid, sessions[key].userid);
            if (typeof req.session.userid !== 'undefined') {
                if (req.session.userid === sessions[key].userid) {
                    users.add(sessions[key].userid)
                }
            }
        }
    })
})

app.get("/api/user", (req, res) => {
    res.json({ userid: req.session.userid })
})

app.get("/login", (req, res) => {
    // console.log(typeof req.session.userid);
    if (typeof req.session.userid === 'undefined') {
        session = req.session;
        session.userid = uuidv4();
        // console.log(req.session);
    }
    // console.log(typeof req.session.userid);
    if (req.session.userid) {
        res.redirect('/');
    }
})

app.get('/logout', (req, res) => {
    users.forEach((point) => {
        if (req.session.userid) {
            users.delete(point);
        }
    });
    req.session.destroy();
    res.redirect('/');
});
io.on("connection", (socket) => {
    socket.on("join", param => {
        io.emit("online", users.size)
    })
    socket.on("message", param => {
        console.log("success");
        io.emit("message", param)
    })
})

const PORT = 4000

server.listen(PORT, () => {
    console.log(`Server Running at http://localhost:${PORT}`);
})