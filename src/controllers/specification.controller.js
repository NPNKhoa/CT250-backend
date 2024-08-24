import { Specification } from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId';
import logError from '../utils/logError';

export const getAllSpecifications = async (req, res) => {
  try {
    const { specificationName = '', page = 1, limit = 10 } = req.query;

    const query = {};

    if (specificationName) {
      query.specificationName = { $regex: specificationName, $options: 'i' };
    }

    const specifications = await Specification.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (!Array.isArray(specifications) || specifications.length === 0) {
      return res.status(404).json({
        error: 'Specification not found',
      });
    }

    const totalDocs = await Specification.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limit);

    res.status(200).json({
      data: specifications,
      error: false,
      meta: {
        totalDocs,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getSpecificationById = async (req, res) => {
  try {
    const { id: specificationId } = req.params;

    if (!specificationId || !isValidObjectId(specificationId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const specification = await Specification.findById(specificationId);

    if (!specification) {
      return res.status(404).json({
        error: 'Specification not found',
      });
    }

    res.status(200).json({
      data: specification,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const addSpecification = async (req, res) => {
  try {
    const { specificationName } = req.body;

    if (!specificationName) {
      return res.status(400).json({
        error: 'Missing required filed',
      });
    }

    const existingSpecification = await Specification.findOne({
      specificationName,
    });

    if (existingSpecification) {
      return res.status(400).json({
        error: 'This specification already exist',
      });
    }

    const newSpecification = await Specification.create({ specificationName });

    res.status(201).json({
      data: newSpecification,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateSpecification = async (req, res) => {
  try {
    const { id: specificationId } = req.params;

    if (!specificationId || !isValidObjectId(specificationId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const { specificationName } = req.body;

    const existingSpecification = await Specification.findOne({
      _id: { $ne: specificationId },
      specificationName,
    });

    if (existingSpecification) {
      return res.status(409).json({
        error: 'This specification is already exist',
      });
    }

    const updatedSpecification = await Specification.findByIdAndUpdate(
      specificationId,
      { specificationName },
      { new: true, runValidators: true }
    );

    if (!updatedSpecification) {
      return res.status(404).json({
        error: 'Specification not found',
      });
    }

    res.status(200).json({
      data: updatedSpecification,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteSpecification = async (req, res) => {
  try {
    const { id: specificationId } = req.params;

    if (!specificationId || !isValidObjectId(specificationId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const deletedSpecification = await Specification.findByIdAndDelete(
      specificationId
    );

    if (!deletedSpecification) {
      return res.status(404).json({
        error: 'Specification not found',
      });
    }

    res.status(200).json({
      message: 'Specification deleted successfully',
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
