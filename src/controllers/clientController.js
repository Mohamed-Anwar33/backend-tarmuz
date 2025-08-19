const Contact = require('../models/Contact');
const Client = require('../models/Client');
const sendEmail = require('../utils/email');

exports.submitContact = async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    await sendEmail(process.env.EMAIL_USER, 'New Contact', `Name: ${req.body.name}\nMessage: ${req.body.message}`);
    res.status(201).json({ msg: 'Message sent' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get all clients
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get single client
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Create client
exports.createClient = async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(400).json({ msg: err.message });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    
    res.json(client);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(400).json({ msg: err.message });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }
    res.json({ msg: 'Client deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};