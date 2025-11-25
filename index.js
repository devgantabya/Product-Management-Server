const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
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

        app.get("/products", (req, res) => {

        })

        app.post("/users", (req, res) => {

        })

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