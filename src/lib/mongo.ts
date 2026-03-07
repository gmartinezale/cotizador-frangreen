import mongoose, { Connection } from "mongoose";

let cachedDb: Connection;

const MONGO_URI = process.env.MONGO_DB_URI || "mongodb://localhost:27017/";

export const connectDB = async (): Promise<Connection> => {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    // Solo log en desarrollo, sin exponer URI
    if (process.env.NODE_ENV !== "production") {
      console.log("Conectando a la base de datos...");
    }
    const db = await mongoose.connect(MONGO_URI);

    if (process.env.NODE_ENV !== "production") {
      console.log("Conexión a la base de datos establecida");
    }
    cachedDb = db.connection;
    return db.connection;
  } catch (error) {
    console.error("Error al conectar a la base de datos");
    throw error;
  }
};
