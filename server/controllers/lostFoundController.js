
const mongoose = require("mongoose");
const LostFound = require("../models/LostFound");
const LostFoundClaim = require("../models/LostFoundClaim");
const { getGridFSBucket } = require("../config/gridfs");

// Helper 1: Upload image to MongoDB GridFS
const uploadImageToGridFS = (file, userId, tenantId) => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();

    const uploadStream = bucket.openUploadStream(
      file.originalname,
      {
        metadata: {
          contentType: file.mimetype,
          uploadedBy: userId,
          tenantId,
        },
      }
    );

    uploadStream.on("error", reject);

    uploadStream.on("finish", () => {
      resolve(uploadStream.id);
    });

    uploadStream.end(file.buffer);
  });
};

// Helper 2: Convert GridFS IDs into image API URLs
const createImageUrl = (imageId) => {
  return `/api/lost-found/images/${imageId}`;
};

// Helper 3: Format item images for API response
const formatItemImages = (item) => {
  const data = item.toObject();

  data.images = (data.images || []).map((imageId) =>
    createImageUrl(imageId)
  );

  return data;
};

// 1. Create a Lost or Found item
const createItem = async (req, res) => {
  const uploadedImageIds = [];

  try {
    const {
      itemType,
      title,
      description,
      category,
      location,
      date,
    } = req.body;

    if (
      !itemType ||
      !title ||
      !description ||
      !category ||
      !location ||
      !date
    ) {
      return res.status(400).json({
        success: false,
        message: "All required item fields must be provided",
      });
    }

    if (!["Lost", "Found"].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: "Item type must be Lost or Found",
      });
    }

    const allowedCategories = [
      "Electronics",
      "Documents",
      "Books",
      "Accessories",
      "Clothing",
      "Other",
    ];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item category",
      });
    }

    if (Number.isNaN(Date.parse(date))) {
      return res.status(400).json({
        success: false,
        message: "Invalid item date",
      });
    }

    const files = req.files || [];

    if (files.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 images are allowed",
      });
    }

    // Upload images to GridFS
    for (const file of files) {
      const imageId = await uploadImageToGridFS(
        file,
        req.user._id,
        req.campus._id
      );

      uploadedImageIds.push(imageId);
    }

    // Save item and image IDs in LostFound collection
    const item = await LostFound.create({
      itemType,
      title,
      description,
      category,
      location,
      date,
      images: uploadedImageIds,
      postedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Lost & Found item posted successfully",
      item: formatItemImages(item),
    });
  } catch (error) {
    console.error("Create item error:", error.message);

    // Delete uploaded files if item creation fails
    if (uploadedImageIds.length > 0) {
      const bucket = getGridFSBucket();

      await Promise.all(
        uploadedImageIds.map(async (imageId) => {
          try {
            await bucket.delete(imageId);
          } catch (deleteError) {
            console.error(
              "Image cleanup error:",
              deleteError.message
            );
          }
        })
      );
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create item",
    });
  }
};

// 2. Get all items with search, filters and pagination
const getItems = async (req, res) => {
  try {
    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const { type, status, category, search } = req.query;

    const filter = {};

    if (type) {
      if (!["Lost", "Found"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid item type",
        });
      }

      filter.itemType = type;
    }

    if (status) {
      const allowedStatuses = [
        "Open",
        "Claim Pending",
        "Resolved",
        "Rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid item status",
        });
      }

      filter.status = status;
    }

    if (category) {
      const allowedCategories = [
        "Electronics",
        "Documents",
        "Books",
        "Accessories",
        "Clothing",
        "Other",
      ];

      if (!allowedCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid item category",
        });
      }

      filter.category = category;
    }

    if (search && search.trim()) {
      const safeSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const regex = new RegExp(safeSearch, "i");

      filter.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
      ];
    }

    const [items, total] = await Promise.all([
      LostFound.find(filter)
        .populate("postedBy", "name email role")
        .populate("verifiedBy", "name role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      LostFound.countDocuments(filter),
    ]);

    const formattedItems = items.map(formatItemImages);

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      items: formattedItems,
    });
  } catch (error) {
    console.error("Get items error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch Lost & Found items",
    });
  }
};

// 3. Get a single item by ID
const getItemById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
      });
    }

    const item = await LostFound.findById(req.params.id)
      .populate("postedBy", "name email role")
      .populate("verifiedBy", "name role");

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.status(200).json({
      success: true,
      item: formatItemImages(item),
    });
  } catch (error) {
    console.error("Get item error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch item",
    });
  }
};

// 4. Retrieve an image from GridFS
const getImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image ID",
      });
    }

    const bucket = getGridFSBucket();

    const files = await bucket
      .find({
        _id: new mongoose.Types.ObjectId(imageId),
        "metadata.tenantId": req.campus._id,
      })
      .toArray();

    if (!files.length) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const file = files[0];

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const contentType = file.metadata?.contentType;

    if (!allowedTypes.includes(contentType)) {
      return res.status(415).json({
        success: false,
        message: "Unsupported image type",
      });
    }

    res.set("Content-Type", contentType);
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Cache-Control", "private, max-age=86400");

    const downloadStream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(imageId)
    );

    downloadStream.on("error", (error) => {
      console.error("Image stream error:", error.message);

      if (!res.headersSent) {
        res.status(500).end("Unable to retrieve image");
      } else {
        res.destroy();
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error("Get image error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve image",
    });
  }
};

// 5. Submit a claim for a Found item
const submitClaim = async (req, res) => {
  try {
    const { message, proofDescription } = req.body;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      typeof proofDescription !== "string" ||
      !proofDescription.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Claim message and ownership proof are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
      });
    }

    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (item.itemType !== "Found") {
      return res.status(400).json({
        success: false,
        message: "Claims can only be submitted for Found items",
      });
    }

    if (String(item.postedBy) === String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot claim an item you posted",
      });
    }

    if (item.status !== "Open") {
      return res.status(409).json({
        success: false,
        message: "This item is not currently accepting claims",
      });
    }

    const claim = await LostFoundClaim.create({
      item: item._id,
      claimedBy: req.user._id,
      message: message.trim(),
      proofDescription: proofDescription.trim(),
    });

    item.status = "Claim Pending";
    await item.save();

    return res.status(201).json({
      success: true,
      message: "Claim submitted successfully. Awaiting verification.",
      claim,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a claim for this item",
      });
    }

    console.error("Submit claim error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit claim",
    });
  }
};

// 6. Get claims
const getClaims = async (req, res) => {
  try {
    const filter = {};

    // Students and Student CR can see only their own claims
    if (!["Admin", "Teacher"].includes(req.user.role)) {
      filter.claimedBy = req.user._id;
    }

    if (req.query.status) {
      if (!["Pending", "Approved", "Rejected"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid claim status",
        });
      }

      filter.status = req.query.status;
    }

    const claims = await LostFoundClaim.find(filter)
      .populate("item")
      .populate("claimedBy", "name email role")
      .populate("reviewedBy", "name role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: claims.length,
      claims,
    });
  } catch (error) {
    console.error("Get claims error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch claims",
    });
  }
};



const reviewClaim = async (req, res) => {
  try {
    const { decision, reviewMessage } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be Approved or Rejected",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.claimId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid claim ID",
      });
    }

    const claim = await LostFoundClaim.findById(req.params.claimId);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    if (claim.status !== "Pending") {
      return res.status(409).json({
        success: false,
        message: "Claim already reviewed",
      });
    }

    const item = await LostFound.findById(claim.item);

    if (!item || item.status !== "Claim Pending") {
      return res.status(409).json({
        success: false,
        message: "Item is not awaiting claim verification",
      });
    }

    claim.status = decision;
    claim.reviewedBy = req.user._id;
    claim.reviewMessage = reviewMessage || "";
    claim.reviewedAt = new Date();

    if (decision === "Approved") {
      item.status = "Resolved";
      item.verifiedBy = req.user._id;
      item.resolvedAt = new Date();

      // Automatically reject all other pending claims
      await LostFoundClaim.updateMany(
        {
          item: item._id,
          _id: { $ne: claim._id },
          status: "Pending",
        },
        {
          $set: {
            status: "Rejected",
            reviewedBy: req.user._id,
            reviewMessage: "Another ownership claim was approved.",
            reviewedAt: new Date(),
          },
        }
      );
    } else {
      item.status = "Open";
    }

    await claim.save();
    await item.save();

    return res.status(200).json({
      success: true,
      message: `Claim ${decision.toLowerCase()} successfully`,
      claim,
      item: formatItemImages(item),
    });
  } catch (error) {
    console.error("Review claim error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to review claim",
    });
  }
};


const updateItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Open", "Resolved"].includes(status)) return res.status(400).json({success:false,message:"Status must be Open or Resolved"});
    const item = await LostFound.findById(req.params.id);
    if (!item) return res.status(404).json({success:false,message:"Item not found"});
    if (item.status === "Claim Pending") return res.status(409).json({success:false,message:"Review the pending claim before changing item status"});
    item.status = status;
    item.resolvedAt = status === "Resolved" ? new Date() : null;
    item.verifiedBy = status === "Resolved" ? req.user._id : null;
    await item.save();
    res.json({success:true,message:"Item status updated",item:formatItemImages(item)});
  } catch (e) {
    res.status(500).json({success:false,message:"Unable to update item status"});
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
      });
    }

    const item = await LostFound.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const bucket = getGridFSBucket();

    // Delete all associated GridFS images
    for (const imageId of item.images || []) {
      try {
        await bucket.delete(imageId);
      } catch (error) {
        console.error("Image deletion error:", error.message);
      }
    }

    // Delete related claims
    await LostFoundClaim.deleteMany({
      item: item._id,
    });

    // Delete item
    await LostFound.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Item, images and related claims deleted successfully",
    });
  } catch (error) {
    console.error("Delete item error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete item",
    });
  }
};

// 8. Admin deletes item, its images and related claims


module.exports = {
  createItem,
  getItems,
  getItemById,
  getImage,
  submitClaim,
  getClaims,
  reviewClaim,
  updateItemStatus,
  deleteItem,
};
