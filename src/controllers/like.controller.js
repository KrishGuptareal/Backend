import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Video not found");

  if (!req.user?._id) throw new ApiError(403, "Login to like the video");

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (!existingLike) {
    const result = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    return res.status(200).json(new ApiResponse(200, result, "Liked"));
  } else {
    const result = await Like.deleteOne({
      _id: existingLike._id,
    });
    return res.status(200).json(new ApiResponse(200, result, "Liked removed"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!isValidObjectId(commentId))
    throw new ApiError(400, "comment  not found");

  if (!req.user?._id) throw new ApiError(403, "Login to like the Comment");

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (!existingLike) {
    const result = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    return res.status(200).json(new ApiResponse(200, result, "Liked"));
  } else {
    const result = await Like.deleteOne({
      _id: existingLike._id,
    });
    return res.status(200).json(new ApiResponse(200, result, "Liked removed"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Tweet  not found");

  if (!req.user?._id) throw new ApiError(403, "Login to like the Tweet");

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (!existingLike) {
    const result = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    return res.status(200).json(new ApiResponse(200, result, "Liked"));
  } else {
    const result = await Like.deleteOne({
      _id: existingLike._id,
    });
    return res.status(200).json(new ApiResponse(200, result, "Liked removed"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  if (!req.user?._id) throw new ApiError(401, "Login to get liked videos");
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $exists: true }
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video"
      }
    },
    { $unwind: "$video" },
    {
      $project: {
        _id: 0,
        "video._id": 1,
        "video.videoFile": 1,
        "video.thumbnail": 1,
        "video.owner": 1,
        "video.title": 1,
        "video.description": 1,
        "video.duration": 1,
        "video.views": 1,
        "video.isPublished": 1
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "liked Videos fetched"))
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
