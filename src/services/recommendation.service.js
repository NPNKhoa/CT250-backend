import { Order } from '../models/order.model.js';
import ProductReview from '../models/comment.model.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';

export class RecommendationService {
  static async suggestProduct(userId) {
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
      order.orderDetail.map((cartDetail) => cartDetail.product._id)
    );

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

      { $unwind: { path: '$userOrders', preserveNullAndEmptyArrays: true } },

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
          productsFromOrders: {
            $map: {
              input: '$orderDetailsProducts',
              as: 'cartDetail',
              in: {
                productId: '$$cartDetail.product',
                purchaseScore: 1,
                reviewScore: 0,
              },
            },
          },

          productsFromReviews: {
            $map: {
              input: '$userReviews',
              as: 'review',
              in: {
                productId: '$$review.product',
                purchaseScore: 0,
                reviewScore: {
                  $cond: {
                    if: { $gte: ['$$review.star', 4] },
                    then: 2,
                    else: {
                      $cond: {
                        if: { $eq: ['$$review.star', 3] },
                        then: 1,
                        else: 0,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      {
        $project: {
          allProducts: {
            $concatArrays: ['$productsFromOrders', '$productsFromReviews'],
          },
          productIds: {
            $map: {
              input: {
                $concatArrays: ['$productsFromOrders', '$productsFromReviews'],
              },
              as: 'productDetail',
              in: '$$productDetail.productId',
            },
          },
        },
      },

      {
        $match: {
          allProducts: { $ne: [] },
        },
      },

      { $unwind: '$allProducts' },

      {
        $match: {
          'allProducts.productId': { $nin: Array.from(purchasedProducts) },
        },
      },

      {
        $group: {
          _id: '$allProducts.productId',
          score: {
            $sum: {
              $add: ['$allProducts.purchaseScore', '$allProducts.reviewScore'],
            },
          },
        },
      },

      {
        $project: {
          _id: 1,
          allProducts: 1,
          score: 1,
        },
      },

      { $sort: { score: -1 } },
      { $limit: 5 },
    ]);

    console.log(JSON.stringify(similarUsers, null, 2));

    const recommendedProducts = await Product.find({
      _id: { $in: similarUsers.map((product) => product._id) },
    }).exec();

    return recommendedProducts;
  }
}
