const express = require("express");
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());


const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://sakif:hvItr3Wb3oQqCfjK@cluster0.w0ws3zg.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


const verifyToken = async(req,res,next)=>{
  const token = req.cookies?.token;
  console.log('from middleware',token)
  if(!token){
    return res.status(401).send({
      message:'not authorized'
    })
  }

  jwt.verify(token,'2aa83640f796c3bb0448c8f90975923f503d8dbeb3d3d56eb0326b0403f0d5e09ff5f6dd4a641cd338a9fef29eac5069b66fe9bcffeba5c3bf9c11c2198176fb',(err,decoded)=>{
    if (err) {
      console.log(err)
      return res.status(401).send({message:'unauthorized'})
    }
    // console.log('value in the token',decoded)
    req.user = decoded
    next()
  })

  
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const booksCollection = client.db('library').collection('books');
    const borrowBooksCollection = client.db('library').collection('borrowBooks');



    app.get("/books",verifyToken, async (req, res) => {
      const cursor = booksCollection.find();
      const result = await cursor.toArray();
      res.send(result);
      // console.log(result)
    });

   
    app.get("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    app.post("/book",verifyToken, async (req, res) => {
      const newBook = req.body;
      console.log(newBook);
      const result = await booksCollection.insertOne(newBook);
      // console.log(result);
      res.send(result);
    });


    app.put("/book/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateBook = req.body;
      const book = {
        $set: {
          name: updateBook.name,
          quantity: updateBook.quantity,
          authorName: updateBook.authorName,
          category: updateBook.category,
          description: updateBook.description,
          rating: updateBook.rating,
          image: updateBook.image,
        },
      };
      const result = await booksCollection.updateOne(filter,book,options)
      res.send(result)
      // console.log(result)
    });


    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user,'2aa83640f796c3bb0448c8f90975923f503d8dbeb3d3d56eb0326b0403f0d5e09ff5f6dd4a641cd338a9fef29eac5069b66fe9bcffeba5c3bf9c11c2198176fb',{expiresIn: '800h'})
      // console.log(token)
      // res.send(token);
      res
      .cookie('token',token,{
        httpOnly:true,
        secure:false
      })
      .send({success:true})
    })


    app.post('/logout',async(req,res)=>{
      const user = req.body;
      console.log('logging out',user)
      res.clearCookie('token',{maxAge:0}).send({success:true})
    })



    app.get("/borrowedBooks", async (req, res) => {
      const cursor = borrowBooksCollection.find();
      const result = await cursor.toArray();
      res.send(result);
      // console.log(result)
    });


    app.get("/book/:borrowId", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    app.post("/borrowedBooks", async (req, res) => {
      const newBorrowBook = req.body;
      // console.log(newBorrowBook);
      const result = await borrowBooksCollection.insertOne(newBorrowBook);
      // console.log(result);
      res.send(result);
    });

    app.get("/booksCategories", async (req, res) => {
      const cursor = booksCollection.find();
      const result = await cursor.toArray();
      res.send(result);
      // console.log(result)
    });

    app.get("/booksCategories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });



    app.put("/booksCategories/:id", async (req, res) => {
      console.log(req.body)
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateBookQuantity = req.body;
      console.log(updateBookQuantity)
      if (updateBookQuantity === 0) {
        return res.status(400).json({ error: 'No available copies to borrow' });
      }
      const book = {
        $set: {
          quantity: updateBookQuantity.quantity-1
          
        },
      };
      const result = await booksCollection.updateOne(filter,book,options)
  
      res.send(result)
      console.log(result)
      
      });

      app.get("/returnBooks", async (req, res) => {
        const cursor = booksCollection.find();
        const result = await cursor.toArray();
        res.send(result);
        // console.log(result)
      });

      app.get("/returnBooks/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await booksCollection.findOne(query);
        res.send(result);
      });


      app.put("/returnBooks/:id", async (req, res) => {
        console.log(req.body)
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateBookQuantity = req.body;
        console.log(updateBookQuantity)
        if (updateBookQuantity === 0) {
          return res.status(400).json({ error: 'No available copies to borrow' });
        }
        const book = {
          $set: {
            quantity: updateBookQuantity.updatedBookQuantity+1
            
          },
        };
        const result = await booksCollection.updateOne(filter,book,options)
    
        res.send(result)
        console.log(result)
        
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

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
