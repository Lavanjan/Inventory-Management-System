const ItemModel = require("../models/item");
const multer = require("multer");
const AWS = require("aws-sdk");
const { verifyToken } = require("../middleware/verifyToken");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error("Only JPEG or PNG images are allowed");
      error.code = "LIMIT_FILE_TYPES";
      return cb(error, false);
    }
    cb(null, true);
  },
}).single("image");

exports.createItem = async (req, res) => {
  verifyToken(req, res, async () => {
    try {
      upload(req, res, (err) => {
        if (err) {
          if (err.code === "LIMIT_FILE_TYPES") {
            return res.status(400).json({ error: err.message });
          }
          return res.status(500).json({ error: err.message });
        }

        const { name, quantity } = req.body;
        const image = req.file;

        if (!name || !quantity || !image) {
          return res
            .status(400)
            .json({ error: "Name, quantity, and image are required" });
        }

        const filename = Date.now() + "-" + image.originalname;

        const params = {
          Bucket: process.env.BUCKET_NAME,
          Key: filename,
          Body: image.buffer,
          ContentType: image.mimetype,
          ACL: "public-read",
        };

        s3.upload(params, async (err, data) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
          }

          const newItem = new ItemModel({
            name,
            quantity,
            imageUrl: data.Location,
          });

          try {
            const savedItem = await newItem.save();
            res.status(201).json(savedItem);
          } catch (error) {
            console.log(error);
            return res.status(500).json({ error: error.message });
          }
        });
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  });
};

exports.updateItem = async (req, res) => {
  verifyToken(req, res, async () => {
    try {
      upload(req, res, async (err) => {
        if (err) {
          if (err.code === "LIMIT_FILE_TYPES") {
            return res.status(400).json({ error: err.message });
          }
          return res.status(500).json({ error: err.message });
        }

        const { id } = req.params;
        const { name, quantity } = req.body;
        const image = req.file;

        if (!name || !quantity) {
          return res
            .status(400)
            .json({ error: "Name and quantity are required" });
        }

        let imageUrl = null;

        if (image) {
          const filename = Date.now() + "-" + image.originalname;

          const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: filename,
            Body: image.buffer,
            ContentType: image.mimetype,
            ACL: "public-read",
          };

          const data = await s3.upload(params).promise();
          imageUrl = data.Location;
        }

        const item = await ItemModel.findById(id);

        if (!item) {
          return res.status(404).json({ error: "Item not found" });
        }

        item.name = name;
        item.quantity = quantity;

        if (imageUrl) {
          item.imageUrl = imageUrl;
        }

        const updatedItem = await item.save();

        res.status(200).json(updatedItem);
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  });
};

exports.getAllItems = async (req, res) => {
  verifyToken(req, res, async () => {
    try {
      const items = await ItemModel.find();
      res.status(200).json(items);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  });
};

exports.deleteItem = async (req, res) => {
  verifyToken(req, res, async () => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "Item ID is required" });
      }

      const item = await ItemModel.findById(id);

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: item.imageUrl.split("/").pop(),
      };

      s3.deleteObject(params, async (err, data) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: err.message });
        }

        try {
          await ItemModel.findByIdAndDelete(id);
          res.status(204).send();
        } catch (error) {
          console.log(error);
          return res.status(500).json({ error: error.message });
        }
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  });
};
