import { Product } from '../models/product.model.js';
import Comment from '../models/comment.model.js';

export const recomendationNewProduct = async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const newProducts = await Product.find({})
            .populate('category')
            .populate('discount')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.status(200).json({
            data: newProducts,
            error: false,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Internal server error',
        });
    }
}

export const recomendationByRating = async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const allProduct = await Product.find({})
            .populate('category')
            .populate('discount')
            .lean();


        const allProductReview = await Comment.find({})
            .lean();

        const products = allProduct.map(product => {
            const reviews = allProductReview.filter(review => review.product.toString() === product._id.toString());
            const totalStars = reviews.reduce((acc, review) => acc + review.star, 0);
            const averageStar = reviews.length > 0 ? totalStars / reviews.length : 0;
            return {
                ...product,
                avgStar: averageStar,
                reviewCount: reviews.length
            };
        });

        const sortedProducts = products.sort((a, b) => {
            if (b.avgStar !== a.avgStar) {
                return b.avgStar - a.avgStar;
            }

            return b.reviewCount - a.reviewCount;
        });

        const topProducts = sortedProducts.slice(0, limit);

        return res.status(200).json({
            data: topProducts,
            error: false,
        });
    }
    catch (error) {
        return res.status(500).json({
            error: 'Internal server error',
        });
    }
}

export const recomendationSimilarProduct = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const { productId } = req.body;

        const parsedLimit = parseInt(limit, 10);

        const product = await Product.findById(productId).populate('category').lean();
        if (!product) {
            return res.status(404).json({
                error: 'Product not found',
            });
        }

        const similarProducts = await Product.aggregate([
            {
                $match: {
                    price: { $gte: product.price * 0.8, $lte: product.price * 1.2 },
                    _id: { $ne: productId },
                },
            },
            {
                $lookup: {
                    from: 'categories', 
                    localField: 'category', 
                    foreignField: '_id',
                    as: 'categoryDetails',
                },
            },
            {
                $unwind: '$categoryDetails',
            },
            {
                $lookup: {
                    from: 'discounts', 
                    localField: 'discount', 
                    foreignField: '_id',
                    as: 'discountDetails',
                },
            },
            {
                $unwind: '$discountDetails',
            },
            {
                $match: {
                    'categoryDetails.productType': product.category.productType,
                },
            },
            {
                $limit: parsedLimit, 
            },
        ]);
        
        return res.status(200).json({
            data: similarProducts,
            error: false,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Internal server error',
        });
    }
};