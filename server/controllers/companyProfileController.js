import CompanyProfile from '../models/CompanyProfile.js';

export const getCompanyProfile = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne();
    if (!profile) {
      profile = await CompanyProfile.create({
        businessName: 'Shree Sai Tyres',
      });
    }
    return res.status(200).json({ success: true, profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCompanyProfile = async (req, res) => {
  try {
    let profile = await CompanyProfile.findOne();
    if (!profile) {
      profile = new CompanyProfile(req.body);
    } else {
      Object.assign(profile, req.body);
    }
    await profile.save();
    return res.status(200).json({ success: true, profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
