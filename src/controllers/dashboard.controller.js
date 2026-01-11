import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  if (!req.user?._id) throw new ApiError(401, "User not logged in");

  //subscriber(subscription model-->(match channel and count))
  const subscriberCount = await Subscription.countDocuments({
    channel: req.user._id,
  });

  //total videos(video model-->match the owner and count)
  const videoCount = await Video.countDocuments({
    owner: req.user._id,
  });

  //total veiws(video model-->match owner and add all the views)
  const result = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
      },
    },
  ]);
  //[{_id:null,totalview:974}]

  const totalViews = result.length > 0 ? result[0].totalViews : 0;

  //total likes (video model get the videos then match this videos with likes and get the count)

  const agg = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    { $unwind: "$video" },
    {
        $match:{
            "video.owner":new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $group:{
            _id:null,
            totalLikes:{$sum:1}
        }
    }
  ]);

  const totalLikes=agg.length>0?agg[0].totalLikes:0


  return res.
  status(200)
  .json(new ApiResponse(200,{
    subscriberCount,totalLikes,totalViews,videoCount
  },"channel stats fetched successfully"))
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  if (!req.user?._id) throw new ApiError(401, "User not logged in");

  const videos=await Video.find({owner:req.user._id})

  return res
  .status(200)
  .json(new ApiResponse(200,videos,"Channel videos fetched"))


});

export { getChannelStats, getChannelVideos };
