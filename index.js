const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//product-management-db
//SnoGvW3dds6UTGT7
const uri = "mongodb+srv://product-management-db:SnoGvW3dds6UTGT7@cluster0.7smyhy0.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get("/", (req, res) => {
    res.send("product management server is available");
})

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const productsDB = client.db('productsDB')
        const productsCollection = productsDB.collection('products');
        const contactCollection = productsDB.collection('contacts');

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

        app.post("/users", (req, res) => {

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
        await client.db("admin").command({ ping: 1 });

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`product management server started on port: ${port}`);
})