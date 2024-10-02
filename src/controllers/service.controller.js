import logError from '../utils/logError.js';
import { Service } from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';

export const addServices = async (req, res) => {
    try {
        const { serviceName, servicePrice } = req.body;

        if (!serviceName || !servicePrice) {
            return res.status(400).json({
                error: 'Missing required fields!',
            });
        }

        const existingService = await Service.findOne({ serviceName });

        if (existingService) {
            return res.status(409).json({
                error: 'Service is already exist!',
            });
        }

        const newService = await Service.create({
            serviceName,
            servicePrice,
        });

        res.status(201).json({
            data: newService,
            error: false,
        });
    } catch (error) {
        logError(error, res);
    }
};

export const getAllServices = async (req, res) => {
    try {
        const { serviceName = '', page = 1, limit = 10 } = req.query;
        const parsedLimit = parseInt(limit);

        const query = {};

        if (serviceName) {
            query.serviceName = { $regex: serviceName, $options: 'i' };
        }

        let services;
        if (parsedLimit === -1) {
            services = await Service.find(query);
        } else {
            services = await Service.find(query)
                .skip((page - 1) * parsedLimit)
                .limit(parsedLimit);
        }

        if (!Array.isArray(services) || services.length === 0) {
            return res.status(404).json({
                error: 'Not found services!',
            });
        }

        const totalDocs = await Service.countDocuments(query);
        const totalPage = parsedLimit === -1 ? 1 : Math.ceil(totalDocs / parsedLimit);

        res.status(200).json({
            data: services,
            totalDocs,
            totalPage,
            error: false,
        });
    } catch (error) {
        logError(error, res);
    }
};

export const getServiceById = async (req, res) => {
    try {
        const { id: serviceId } = req.params;

        if (!serviceId || !isValidObjectId(serviceId)) {
            return res.status(400).json({
                error: 'Invalid id',
            });
        }

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({
                error: 'Service not found!',
            });
        }

        res.status(200).json({
            data: service,
            error: false,
        });
    } catch (error) {
        logError(error, res);
    }
};

export const updateService = async (req, res) => {
    try {
        const { id: serviceId } = req.params;
        const { serviceName = '', servicePrice = '' } = req.body;

        if (!serviceId || !isValidObjectId(serviceId)) {
            return res.status(400).json({
                error: 'Invalid id',
            });
        }

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({
                error: 'Service not found!',
            });
        }

        service.serviceName = serviceName;
        service.servicePrice = servicePrice;

        await service.save();

        res.status(200).json({
            data: service,
            error: false,
        });
    } catch (error) {
        logError(error, res);
    }
};

export const deleteService = async (req, res) => {
    try {
        const { id: serviceId } = req.params;

        if (!serviceId || !isValidObjectId(serviceId)) {
            return res.status(400).json({
                error: 'Invalid id',
            });
        }

        const service = await Service.findByIdAndDelete(serviceId);

        if (!service) {
            return res.status(404).json({
                error: 'Service not found!',
            });
        }

        res.status(200).json({
            message: 'Promotion deleted successfully!',
            error: false,
        });
    } catch (error) {
        logError(error, res);
    }
};

export const deleteAllServices = async (req, res) => {
    try {
        await Service.deleteMany();

        res.status(200).json({
            error: false,
        });
    } catch (error) {
        logError(error, res);
    }
};