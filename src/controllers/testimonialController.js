const Contact = require('../models/Contact');
const Testimonial = require('../models/Testimonial');
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

// Get all testimonials
exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Get single testimonial
exports.getTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }
    res.json(testimonial);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Create testimonial
exports.createTestimonial = async (req, res) => {
  try {
    const testimonial = new Testimonial(req.body);
    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(400).json({ msg: err.message });
  }
};

// Update testimonial
exports.updateTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }
    
    res.json(testimonial);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(400).json({ msg: err.message });
  }
};

// Delete testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }
    res.json({ msg: 'Testimonial deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};