const mongoose = require('mongoose');
const User = require('./models/user');

async function seedDB() {
  try {
    await mongoose.connect('mongodb+srv://quotes-user-db:HSvnZa3G3Vi7txcA@quotes-prod.j7vgvbg.mongodb.net/quotes-prod', { useNewUrlParser: true, useUnifiedTopology: true });

    const defaultUser = new User({
      // replace these values with the default user data
      name: 'Alexis',
      email: 'gmartinez.alexis@gmail.com',
      password: 'devricas',
    });

    await defaultUser.save();

    console.log('User created.');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error when created user:', error);
  }
}

seedDB();