const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const tryCatch = require("try-catch");
const app = express();
const port = process.env.PORT || 5000;

// middelwar
app.use(
  cors({
    origin: ["http://localhost:5173",
    "https://assingment-11-78df3.web.app",
    "https://assignment-11-server-theta-sable.vercel.app"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser())

// verify jwt middleware

const logger = async(req, res, next)=>{
  console.log('called:', req.host, req.originalUrl);
  next();
}

const verifyJWT = async(req, res, next)=>{
  const token = req.cookies?.token;
  console.log('value of token in middleware', token);
  if(!token){
    return res.status(401).send({message: 'not authorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      console.log(err);
      return res.status(401).send({message: 'unauthorized'})
    }
    console.log("value in the token ", decoded);
    req.user = decoded
    next()
  })

}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};



app.get("/", (req, res) => {
  res.send("SIMPLE CRUD IS RUNNING");
});

app.listen(port, () => {
  console.log(`SIMPLE CRUD is Running on port, ${port}`);
});

// MONGODB START================================================================================

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ehqhw1m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const sportCollection = client.db("sportDB").collection("sportData");
    const commentCollection = client.db("sportDB").collection("comment");
    const wishCollection = client.db("sportDB").collection("wishlist");

    // JWT Token create ======================================

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });
      res
        .cookie("token", token, cookieOptions, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", //false, //http://localhost:5173/login,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true }); //success: true
    });

    // Clear token =========================================
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", //false, //http://localhost:5173/login,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          ...cookieOptions,
          maxAge: 0,
        })
        .send({ success: true }); //success: true
    });

    //  get Fetured post
    app.get("/blogs", verifyJWT, async (req, res) => {
      try {
        const blogs = await sportCollection.find();
        res.json(blogs);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    app.get("/addblog", async (req, res) => {
      const cursor = sportCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/addblog", async (req, res) => {
      const blogs = req.body;
      console.log(blogs);
      const result = await sportCollection.insertOne(blogs);
      res.send(result);
      console.log(result);
    });


    // app.get('/mypost/:author', async(req, res)=>{
    //   console.log(req.params.email);
    //   const result = await sportCollection.find({ email: req.params.email }).toArray();
    //   res.send(result)
    // })


    app.get("/mypost", logger, async (req, res) => {

      // console.log(req.query.email);
      // console.log( "token owner info-", req.user.email);

      // if(req?.user?.email !== req.query?.email){
      //   return res.status(403).send({message: 'forbidden access'})
      // }
      // console.log('token resive', req.cookies.token);

      let query = {};
      console.log(req.query?.email,"==");
      if (req.query?.email) {
        query = { email: req.query.email };
        console.log(query, 'qyer--');
      }
      const result = await sportCollection.find(query).toArray();
      res.send(result);
    });

    //   app.get('/comment', async(req, res)=>{
    //     const commandId = new ObjectId(req.params.id);
    //     const command = await commentCollection.findOne({id: commandId});
    //     res.send(command)
    // })

    // comment section =========================

    app.get("/comment", async (req, res) => {
      console.log(req.query.id);
      let query = {};
      if (req.query?.id) {
        query = { id: req.query.id };
      }
      const result = await commentCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/comment", async (req, res) => {
      const comment = req.body;
      console.log(comment);
      const result = await commentCollection.insertOne(comment);
      res.send(result);
      console.log(result);
    });

    app.delete("/comment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await commentCollection.deleteOne(query);
      res.send(result);
    });

    // wishlist==================================

    app.get("/wish", logger, async (req, res) => {

      // console.log(req.query.email);
      // console.log( "token owner info-", req.user.email);

      // if(req?.user?.email !== req.query?.email){
      //   return res.status(403).send({message: 'forbidden access'})
      // }
      // console.log('token resive', req.cookies.token);

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await wishCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/wish/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishCollection.deleteOne(query);
      res.send(result);
    });

    // app.get('/wish', async (req, res)=>{
    //   console.log(req.query.id);
    //   let query = {};
    //   if(req.query?.id){
    //     query = {id: req.query.id}
    //   }
    //   const result = await sportCollection.find(query).toArray();
    //   res.send(result)
    // })

    app.post("/wish", async (req, res) => {
      const wishlist = req.body;
      console.log(wishlist);
      const result = await wishCollection.insertOne(wishlist);
      res.send(result);
      console.log(result);
    });

    // Update ==========================================

    app.get("/addblog/:email", async (req, res) => {
      console.log(req.params.email);
      const result = await sportCollection
        .find({ email: req.params.email })
        .toArray();
      res.send(result);
    });

    app.get("/addblog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await sportCollection.findOne(query);
      res.send(result);
      console.log(result);
    });

    app.put("/addblog/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateBlog = req.body;
      const blog = {
        $set: {
          photo: updateBlog.photo,
          title: updateBlog.title,
          shortDes: updateBlog.shortDes,
          longDes: updateBlog.longDes,
          category: updateBlog.category,
        },
      };
      const result = await sportCollection.updateOne(filter, blog, options);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// END MONGODB=======================================================================
