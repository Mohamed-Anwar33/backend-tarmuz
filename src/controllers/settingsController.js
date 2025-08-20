const Settings = require('../models/Settings');
const sendEmail = require('../utils/email');

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
const clean = (v) => String(v || '').trim();

exports.getContactRecipient = async (req, res) => {
  try {
    const doc = await Settings.findOne();
    res.json({ contactRecipient: doc?.contactRecipient || '' });
  } catch (err) {
    res.status(500).json({ msg: 'Internal server error' });
  }
};

exports.updateContactRecipient = async (req, res) => {
  try {
    const email = clean((req.body.contactRecipient || '').toLowerCase());
    if (email && !isEmail(email)) {
      return res.status(400).json({ msg: 'Invalid email' });
    }
    const updated = await Settings.findOneAndUpdate(
      {},
      { contactRecipient: email },
      { new: true, upsert: true }
    );
    res.json({ contactRecipient: updated.contactRecipient || '' });
  } catch (err) {
    res.status(500).json({ msg: 'Internal server error' });
  }
};

// Admin-only: send a test email to the configured recipient to validate prod delivery
exports.testContactEmail = async (req, res) => {
  try {
    const doc = await Settings.findOne();
    const to = clean(doc?.contactRecipient || '');
    if (!to) {
      return res.status(400).json({ msg: 'No contact recipient configured in settings' });
    }
    const subject = 'Test Contact Email (Server)';
    const text = 'This is a server-initiated test to verify contact email delivery.';
    const html = `<p>✅ Test email from server at ${new Date().toISOString()}</p>`;
    try {
      await sendEmail(to, subject, text, html);
      return res.json({ ok: true, to });
    } catch (e) {
      return res.status(502).json({ ok: false, to, error: e?.message || 'Email send failed' });
    }
  } catch (err) {
    return res.status(500).json({ msg: 'Internal server error' });
  }
};

// ---- Login options (public read, admin manage) ----
const mapLoginOptions = (doc) => ({
  loginShowEmail: Boolean(doc?.loginShowEmail),
  loginEnableEmail: Boolean(doc?.loginEnableEmail ?? true),
});

exports.getLoginOptionsPublic = async (req, res) => {
  try {
    const doc = await Settings.findOne();
    return res.json(mapLoginOptions(doc));
  } catch (err) {
    return res.status(500).json({ msg: 'Internal server error' });
  }
};

exports.getLoginOptions = async (req, res) => {
  try {
    const doc = await Settings.findOne();
    return res.json(mapLoginOptions(doc));
  } catch (err) {
    return res.status(500).json({ msg: 'Internal server error' });
  }
};

exports.updateLoginOptions = async (req, res) => {
  try {
    const loginShowEmail = Boolean(req.body.loginShowEmail);
    const loginEnableEmail = Boolean(req.body.loginEnableEmail);
    const updated = await Settings.findOneAndUpdate(
      {},
      { loginShowEmail, loginEnableEmail },
      { new: true, upsert: true }
    );
    return res.json(mapLoginOptions(updated));
  } catch (err) {
    return res.status(500).json({ msg: 'Internal server error' });
  }
};

// ---- Branding (logo) ----
const mapBranding = (doc) => ({
  logoUrl: clean(doc?.logoUrl || ''),
  logoUrlScrolled: clean(doc?.logoUrlScrolled || ''),
});

// Public branding for site consumption
exports.getBrandingPublic = async (req, res) => {
  try {
    const doc = await Settings.findOne();
    return res.json(mapBranding(doc));
  } catch (err) {
    return res.status(500).json({ msg: 'Internal server error' });
  }
};

// Admin read branding
exports.getBranding = async (req, res) => {
  try {
    const doc = await Settings.findOne();
    return res.json(mapBranding(doc));
  } catch (err) {
    return res.status(500).json({ msg: 'Internal server error' });
  }
};

// Admin update branding (logoUrl, logoUrlScrolled)
exports.updateBranding = async (req, res) => {
  try {
    const logoUrl = clean(req.body.logoUrl || '');
    const logoUrlScrolled = clean(req.body.logoUrlScrolled || '');
    const updated = await Settings.findOneAndUpdate(
      {},
      { logoUrl, logoUrlScrolled },
      { new: true, upsert: true }
    );
    return res.json(mapBranding(updated));
  } catch (err) {
    return res.status(500).json({ msg: 'Internal server error' });
  }
};

// ---- General Settings ----
const mapSettings = (doc) => ({
  contactRecipient: clean(doc?.contactRecipient || ''),
  loginShowEmail: Boolean(doc?.loginShowEmail),
  loginEnableEmail: Boolean(doc?.loginEnableEmail ?? true),
  logoUrl: clean(doc?.logoUrl || ''),
  logoUrlScrolled: clean(doc?.logoUrlScrolled || ''),
  showTeamSection: Boolean(doc?.showTeamSection ?? true),
});

// Public settings for frontend consumption
exports.getSettingsPublic = async (req, res) => {
  try {
    const doc = await Settings.findOne();
    // Only return public settings
    return res.json({
      loginShowEmail: Boolean(doc?.loginShowEmail),
      loginEnableEmail: Boolean(doc?.loginEnableEmail ?? true),
      logoUrl: clean(doc?.logoUrl || ''),
      logoUrlScrolled: clean(doc?.logoUrlScrolled || ''),
      showTeamSection: Boolean(doc?.showTeamSection ?? true),
    });
  } catch (err) {
    return res.status(500).json({ msg: 'Internal server error' });
  }
};

// Admin get all settings
exports.getSettings = async (req, res) => {
  try {
    const doc = await Settings.findOne();
    return res.json(mapSettings(doc));
  } catch (err) {
    return res.status(500).json({ msg: 'Internal server error' });
  }
};

// Admin update settings
exports.updateSettings = async (req, res) => {
  try {
    const updateData = {};
    
    if (req.body.contactRecipient !== undefined) {
      const email = clean(req.body.contactRecipient.toLowerCase());
      if (email && !isEmail(email)) {
        return res.status(400).json({ msg: 'Invalid email' });
      }
      updateData.contactRecipient = email;
    }
    
    if (req.body.loginShowEmail !== undefined) {
      updateData.loginShowEmail = Boolean(req.body.loginShowEmail);
    }
    
    if (req.body.loginEnableEmail !== undefined) {
      updateData.loginEnableEmail = Boolean(req.body.loginEnableEmail);
    }
    
    if (req.body.logoUrl !== undefined) {
      updateData.logoUrl = clean(req.body.logoUrl);
    }
    
    if (req.body.logoUrlScrolled !== undefined) {
      updateData.logoUrlScrolled = clean(req.body.logoUrlScrolled);
    }
    
    if (req.body.showTeamSection !== undefined) {
      updateData.showTeamSection = Boolean(req.body.showTeamSection);
    }
    
    const updated = await Settings.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true }
    );
    
    return res.json(mapSettings(updated));
  } catch (err) {
    return res.status(500).json({ msg: 'Internal server error' });
  }
};
