import express from 'express';
import {
  getCompanyProfile,
  updateCompanyProfile,
} from '../controllers/companyProfileController.js';

const router = express.Router();
router.get('/', getCompanyProfile);
router.put('/', updateCompanyProfile);

export default router;
