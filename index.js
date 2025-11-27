const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin");
const port = process.env.PORT || 5000;


const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


app.use(cors());
app.use(express.json());

const logger = (req, res, next) => {
    next();
}

const verifyFirebaseToken = async (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorized access" })
    }

    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
        return res.status(401).send({ message: "Unauthorized access" })
    }

    try {
        await admin.auth().verifyIdToken(token);
        next();
    }
    catch {
        return res.status(401).send({ message: "Unauthorized access" })
    }
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7smyhy0.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get("/", (req, res) => {
    res.send("products management server is available");
})


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const productsDB = client.db('productsDB')
        const usersCollection = productsDB.collection("users");
        const productsCollection = productsDB.collection('products');
        const contactCollection = productsDB.collection('contacts');

        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const email = req.body.email;
            const query = { email: email }
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                res.send({ message: 'user already exits. do not need to insert again' })
            }
            else {
                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            }
        })

        app.get("/products", async (req, res) => {
            const cursor = productsCollection.find()
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get("/products/:id", async (req, res) => {
            try {
                const id = req.params.id;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid product ID" });
                }

                const query = { _id: new ObjectId(id) };
                const product = await productsCollection.findOne(query);

                if (!product) {
                    return res.status(404).json({ error: "Product not found" });
                }

                res.json(product);
            } catch (err) {
                res.status(500).json({ error: "Server error", details: err.message });
            }
        });

        app.post("/products", async (req, res) => {
            const newProduct = req.body;
            newProduct.price = Number(newProduct.price);
            newProduct.created_at = new Date();

            try {
                const productResult = await productsCollection.insertOne(newProduct);

                res.status(201).send({
                    success: true,
                    message: "Product added successfully!",
                    productResult,
                });

            } catch (error) {
                console.error(error);
                res.status(500).send({
                    success: false,
                    message: "Failed to add product.",
                });
            }
        });

        app.get("/my-products", logger, verifyFirebaseToken, async (req, res) => {
            console.log(req.headers);
            const { email } = req.query;
            if (!email) return res.status(400).json({ error: "Email required" });

            const myProducts = await productsCollection.find({ email }).toArray();
            res.json(myProducts);
        });


        app.patch("/my-products/:id", async (req, res) => {
            try {
                const { id } = req.params;

                if (!ObjectId.isValid(id))
                    return res.status(400).json({ error: "Invalid ID" });

                const updateData = req.body;

                if (updateData.price) updateData.price = Number(updateData.price);

                const result = await productsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: "Product not found" });
                }

                if (result.modifiedCount === 0) {
                    return res.json({
                        success: false,
                        modifiedCount: 0,
                        message: "Nothing updated"
                    });
                }

                res.json({
                    success: true,
                    modifiedCount: result.modifiedCount
                });

            } catch (err) {
                console.error("Update error:", err);
                res.status(500).json({ error: "Server error" });
            }
        });




        app.delete("/my-products/:id", async (req, res) => {
            const { id } = req.params;
            if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

            const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
            res.json(result);
        });


        app.post("/contact", async (req, res) => {
            try {
                const { name, email, message } = req.body;

                if (!name || !email || !message) {
                    return res.status(400).json({ error: "All fields are required" });
                }

                const newMessage = {
                    name,
                    email,
                    message,
                    created_at: new Date(),
                };

                const result = await contactCollection.insertOne(newMessage);

                res.status(201).json({ message: "Contact message saved", id: result.insertedId });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Server error", details: err.message });
            }
        });



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });

        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// app.listen(port, () => {
//     console.log(`product management server started on port: ${port}`);
// })
