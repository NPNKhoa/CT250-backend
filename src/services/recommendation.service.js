import { Order } from '../models/order.model.js';
import ProductReview from '../models/comment.model.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import mongoose from 'mongoose';

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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const similarUsers = await User.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },

      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'userOrders',
        },
      },

      {
        $match: {
          userOrders: { $ne: [] },
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

      // {
      //   $match: {
      //     userReviews: { $ne: [] },
      //   },
      // },

      // { $match: { _id: { $ne: userId } } },

      // // { $unwind: { path: '$userOrders', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'cartdetails',
          localField: 'userOrders.orderDetail',
          foreignField: '_id',
          as: 'orderDetailsProducts',
        },
      },

      // { $match: { _id: { $ne: userId } } },

      {
        $project: {
          productsFromOrders: {
            $map: {
              input: '$orderDetailsProducts',
              as: 'orderProduct',
              in: {
                productId: '$$orderProduct.product',
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

      // {
      //   $project: {
      //     _id: 1,
      //     // userOrders: 1,
      //     userReviews: 1,
      //     orderDetailsProducts: 1,
      //     productsFromOrders: 1,
      //     productsFromReviews: 1,
      //     allProducts: 1,
      //   },
      // },

      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails',
        },
      },

      {
        $unwind: '$productDetails',
      },

      {
        $project: {
          _id: 1,
          score: 1,
          createdAt: '$productDetails.createdAt',
        },
      },

      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },

      { $sort: { score: -1 } },
      { $limit: 5 },
    ]);

    console.log(JSON.stringify(similarUsers, null, 2));

    const recommendedProducts = await Product.find({
      _id: { $in: similarUsers.map((product) => product._id) },
    })
      .populate('discount')
      .exec();

    return recommendedProducts;
  }
}
