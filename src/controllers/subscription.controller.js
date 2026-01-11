import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  //find if the user exist in the subscription model and delete it
  //else add it to the database
  //channelid will give the channel name
  //req.user->user
  //find if user,channel exist in subscription model
  const subscriberId = req.user?._id;

  if (!subscriberId) throw new ApiError(401, "Login to subscribe the channel");

  if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel id");

  const channelExists = await User.findById(channelId);
  if (!channelExists) throw new ApiError(404, "Channel not found");

  if (subscriberId.toString() === channelId) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const isSubscribed = await Subscription.exists({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (isSubscribed) {
    await Subscription.findOneAndDelete({
      subscriber: subscriberId,
      channel: channelId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "channel unsubscribed!!"));
  }

  const result = await Subscription.create({
    subscriber: subscriberId,
    channel: channelId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "channel subscribed!!"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const subscriber = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      //now we have all the subscription model
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 0,
        subscriberName: "$subscriber.userName",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, subscriber, "subscribers fetched succesfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber id");
  }

  const channel = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      //now we have all the subscription model
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
      },
    },
    {
      $unwind: "$channel",
    },
    {
      $project: {
        _id: 0,
        channelName: "$channel.userName",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, channel, "channel fetched successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
