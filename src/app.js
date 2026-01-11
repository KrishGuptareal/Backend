import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
const app = express()



app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credential: true
}))


app.use(express.json({ limit: "16kb" }))

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

app.use(express.static("public"))
app.use(cookieParser())


//route imports

import userRouter from "./routes/user.route.js"
import commentRouter from "./routes/comment.route.js"
import dashboardRouter from "./routes/dashboard.route.js"
import healthcheckRouter from "./routes/healthcheck.route.js"
import likeRouter from "./routes/like.route.js"
import playlistRouter from "./routes/playlist.route.js"
import subscriptionRouter from "./routes/subscription.route.js"
import tweetRouter from "./routes/tweet.route.js"
import videoRouter from "./routes/video.route.js"
//routes declaration
app.get('/', (req, res) => res.send('Server is working!'))
app.use('/api/v1/user', userRouter)
app.use('/api/v1/comment', commentRouter)
app.use('/api/v1/dashboard', dashboardRouter)
app.use('/api/v1/healthcheck', healthcheckRouter)
app.use('/api/v1/like', likeRouter)
app.use('/api/v1/playlist', playlistRouter)
app.use('/api/v1/subscription', subscriptionRouter)
app.use('/api/v1/tweet', tweetRouter)
app.use('/api/v1/video', videoRouter)





export { app }