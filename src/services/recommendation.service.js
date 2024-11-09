import { Order } from '../models/order.model.js';
import ProductReview from '../models/comment.model.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';

export class RecommendationService {
  static async suggestProduct(userId, recentViewedProducts) {
    const purchasedProducts = (
      await Order.find({ user: userId })
        .populate({
          path: 'orderDetail',
          model: 'CartDetail',
          populate: {
            path: 'product',
            model: 'Product',
            select: '_id',
          },
        })
        .select('orderDetail')
    ).flatMap((order) =>
      order.orderDetail.map((cartDetail) => cartDetail.product._id.toString())
    );

    const reviewedProducts = (
      await ProductReview.find({
        user: userId,
      }).populate({
        path: 'product',
        model: 'Product',
        select: '_id',
      })
    ).map((review) => review.product._id.toString());

    const interactedProducts = new Set([
      ...recentViewedProducts,
      ...purchasedProducts,
      ...reviewedProducts,
    ]);

    console.log(interactedProducts);

    const similarUsers = await User.aggregate([
      { $match: { _id: { $ne: userId } } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'userOrders',
        },
      },
      {
        $lookup: {
          from: 'productreviews',
          localField: '_id',
          foreignField: 'user',
          as: 'userReviews',
        },
      },
      {
        $unwind: {
          path: '$userOrders',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'cartdetails',
          localField: 'userOrders.orderDetail',
          foreignField: '_id',
          as: 'orderDetailsProducts',
        },
      },
      {
        $project: {
          _id: 1,
          productsFromOrders: {
            $map: {
              input: '$orderDetailsProducts',
              as: 'cartDetail',
              in: '$$cartDetail.product',
            },
          },
          productsFromReviews: {
            $map: {
              input: '$userReviews',
              as: 'review',
              in: '$$review.product',
            },
          },
        },
      },
      {
        $project: {
          allProducts: {
            $concatArrays: ['$productsFromOrders', '$productsFromReviews'],
          },
        },
      },
      {
        $unwind: '$allProducts',
      },
      {
        $match: { allProducts: { $nin: Array.from(interactedProducts) } },
      },
      {
        $group: {
          _id: '$allProducts',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    console.log(similarUsers);

    const recommendedProducts = await Product.find({
      //   _id: { $nin: Array.from([...purchasedProducts, ...reviewedProducts]) },
      _id: {
        $in: similarUsers.map((product) => product._id),
      },
    })
      .limit(5)
      .exec();

    return recommendedProducts;
  }
}
