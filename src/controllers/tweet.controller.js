import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  if (!req.user) throw new ApiError(400, "login to create tweet");

  const content = req.body.content;
  if (!content?.trim()) throw new ApiError(400, "Comment can't be empty");

  const result = await Tweet.create({
    content,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Tweet added successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  if (!req.user) throw new ApiError(400, "User not logged in");

  const tweets = await Tweet.find({
    owner: req.user._id,
  }).select("content");

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) throw new ApiError(400, "tweetid  is invalid");

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(404, "Tweet does not exist");

  if (tweet.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "Only owner can update the tweet");

  const content = req.body.content;
  if (!content?.trim()) throw new ApiError(400, "Tweet cant be empty");

  tweet.content = content;

  const result = await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) throw new ApiError(400, "tweetid  is invalid");

  //   const tweet = await Tweet.findById(tweetId);
  //   if (!tweet) throw new ApiError(404, "Tweet does not exist");

  //   if (tweet.owner.toString() !== req.user._id.toString())
  //     throw new ApiError(403, "Only owner can delete the tweet");

  //   const result = await Tweet.deleteOne({ _id: tweetId });

  //single db call
  const result = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: req.user._id,
  });

  if(!result) throw new ApiError(403,"only Owner can delete the tweet")

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
