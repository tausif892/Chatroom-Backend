
import { MongoClient } from "mongodb";
import argon2 from "argon2";

const sourceUri = "mongodb+srv://productcirc:Ranjesh12345@cluster0.c0jfv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const destUri = "mongodb+srv://mohammadtausif2005:1%40Pathanwadi@chat.s7blolj.mongodb.net/?retryWrites=true&w=majority&appName=chat";

const sourceClient = new MongoClient(sourceUri);
const destClient = new MongoClient(destUri);

async function transferData() {
  try {
    // Connect to both databases
    await sourceClient.connect();
    await destClient.connect();

    const sourceCollection = sourceClient.db("test").collection("businesses");
    const destCollection = destClient.db("test").collection("users");

    // Fetch all documents from source
    const cursor = sourceCollection.find({}, { projection: { legalEntityName: 1 } });

    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      if (!doc.legalEntityName) continue; // Skip if field is missing

      // Encrypt password
      const hashedPassword = await argon2.hash(doc.legalEntityName);

      // Prepare the user object
      const userData = {
        name: doc.legalEntityName,
        username: doc.legalEntityName,
        password: hashedPassword,
        phoneNumber: doc.legalEntityName,
        emailId: doc.legalEntityName,
      };

      // Upsert into destination collection
      await destCollection.updateOne(
        { emailId: doc.legalEntityName }, // Use emailId as unique identifier
        { $set: userData },
        { upsert: true }
      );

      console.log(`Transferred: ${doc.legalEntityName}`);
    }

    console.log("Data transfer complete!");
  } catch (err) {
    console.error("Error during transfer:", err);
  } finally {
    await sourceClient.close();
    await destClient.close();
  }
}

transferData();
