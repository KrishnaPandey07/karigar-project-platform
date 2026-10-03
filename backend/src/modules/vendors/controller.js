const vendorService = require('./service');
const { sendSuccess } = require('../../utils/responseEnvelope');
const { processUploadedFile } = require('../../utils/uploader');
const { BadRequestError } = require('../../utils/errors');

class VendorController {
  async getMyProfile(req, res, next) {
    try {
      const vendor = await vendorService.getVendorByUserId(req.user.id);
      return sendSuccess(res, { vendor }, 'Vendor profile retrieved successfully', 200);
    } catch (err) {
      return next(err);
    }
  }

  async getPublicVendor(req, res, next) {
    try {
      const vendor = await vendorService.getPublicVendorById(req.params.id);
      return sendSuccess(res, { vendor }, 'Public vendor profile retrieved', 200);
    } catch (err) {
      return next(err);
    }
  }

  async updateMyProfile(req, res, next) {
    try {
      const vendor = await vendorService.updateVendorProfile(req.user.id, req.body);
      return sendSuccess(res, { vendor }, 'Profile updated successfully', 200);
    } catch (err) {
      return next(err);
    }
  }

  async toggleAvailability(req, res, next) {
    try {
      const result = await vendorService.toggleAvailability(req.user.id, req.body);
      return sendSuccess(
        res,
        result,
        `Availability updated: you are now ${result.dutyStatus || (result.isAvailable ? 'AVAILABLE' : 'OFFLINE')}`,
        200
      );
    } catch (err) {
      return next(err);
    }
  }

  async getMyServices(req, res, next) {
    try {
      const vendor = await vendorService.getVendorByUserId(req.user.id);
      return sendSuccess(
        res,
        { services: vendor.vendorServices || [] },
        'Vendor services retrieved',
        200
      );
    } catch (err) {
      return next(err);
    }
  }

  async addOrUpdateService(req, res, next) {
    try {
      const service = await vendorService.addOrUpdateService(req.user.id, req.body);
      return sendSuccess(res, { service }, 'Service added/updated successfully', 200);
    } catch (err) {
      return next(err);
    }
  }

  async deleteService(req, res, next) {
    try {
      const result = await vendorService.deleteService(req.user.id, req.params.serviceId);
      return sendSuccess(res, result, 'Service removed', 200);
    } catch (err) {
      return next(err);
    }
  }

  async getMyAvailability(req, res, next) {
    try {
      const vendor = await vendorService.getVendorByUserId(req.user.id);
      return sendSuccess(
        res,
        {
          availabilities: vendor.availabilities || [],
          timeOffs: vendor.timeOffs || [],
        },
        'Availability schedule retrieved',
        200
      );
    } catch (err) {
      return next(err);
    }
  }

  async saveWeeklyAvailability(req, res, next) {
    try {
      const availabilities = await vendorService.saveWeeklyAvailability(
        req.user.id,
        req.body.schedule
      );
      return sendSuccess(res, { availabilities }, 'Weekly schedule updated successfully', 200);
    } catch (err) {
      return next(err);
    }
  }

  async getTimeOff(req, res, next) {
    try {
      const vendor = await vendorService.getVendorByUserId(req.user.id);
      return sendSuccess(res, { timeOffs: vendor.timeOffs || [] }, 'Time off entries retrieved', 200);
    } catch (err) {
      return next(err);
    }
  }

  async addTimeOff(req, res, next) {
    try {
      const timeOff = await vendorService.addTimeOff(req.user.id, req.body);
      return sendSuccess(res, { timeOff }, 'Time off added successfully', 201);
    } catch (err) {
      return next(err);
    }
  }

  async deleteTimeOff(req, res, next) {
    try {
      const result = await vendorService.deleteTimeOff(req.user.id, req.params.timeOffId);
      return sendSuccess(res, result, 'Time off deleted', 200);
    } catch (err) {
      return next(err);
    }
  }

  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        throw new BadRequestError('No image file uploaded');
      }

      const fileUrl = await processUploadedFile(req.file, false);
      const isAvatar = req.body.type === 'avatar' || req.file.fieldname === 'avatar';

      const updateData = isAvatar ? { avatarUrl: fileUrl } : { bannerUrl: fileUrl };
      const vendor = await vendorService.updateImages(req.user.id, updateData);

      return sendSuccess(
        res,
        { fileUrl, vendor },
        `${isAvatar ? 'Avatar' : 'Banner'} uploaded successfully`,
        200
      );
    } catch (err) {
      return next(err);
    }
  }

  async uploadVerificationDoc(req, res, next) {
    try {
      if (!req.file) {
        throw new BadRequestError('No document file uploaded');
      }

      const documentUrl = await processUploadedFile(req.file, true); // private storage!
      const documentType = req.body.documentType || 'BUSINESS_LICENSE';

      const result = await vendorService.uploadVerificationDocument(req.user.id, {
        documentType,
        documentUrl,
      });

      return sendSuccess(
        res,
        result,
        'Verification document submitted successfully for admin review',
        201
      );
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new VendorController();
