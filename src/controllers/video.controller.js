import mongoose, { isValidObjectId, set } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteAsset, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  //query->sort->pagination

  // if(!userId) throw new ApiError(400,"User not logged in")
  const aggPipeline = Video.aggregate([
    ...(userId ? [{
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    }] : []),
    ...(query
      ? [
        {
          $match: {
            $or: [
              { title: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } },
            ],
          },
        },
      ]
      : []),
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
  ]);

  const aggVideos = await Video.aggregatePaginate(aggPipeline, {
    page: Number(page),
    limit: Number(limit),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, aggVideos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!title || !description || !videoLocalPath || !thumbnailLocalPath)
    throw new ApiError(400, "all feilds are required");

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    isPublished: false,
    owner: req.user._id,
    duration: videoFile.duration,
    views: 0,

  });

  return res.status(201).json(new ApiResponse(201, video, "Video created successfully"))
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const video = await Video.findById(videoId);

  if (!video) throw new ApiError(404, "video not found");

  return res.status(200).json(new ApiResponse(200, video, "video found"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  const { title, description } = req.body;
  if (!title || !description)
    throw new ApiError(400, "all feilds are required");
  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail required");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You do not have permission to update this video");
  }

  const old_url = video.thumbnail

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  await deleteAsset(old_url)

  video.thumbnail = thumbnail.url
  video.title = title
  video.description = description

  await video.save()

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video details updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  const video = await Video.findById(videoId)
  if (!video) throw new ApiError(404, "video not found");

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You do not have permission to delete this video");
  }

  const deleteResult = await video.deleteOne()
  await deleteAsset(video.thumbnail)
  await deleteAsset(video.videoFile, 'video')
  return res
    .status(200)
    .json(new ApiResponse(200, deleteResult, "Video deleted successfulluy"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId)
  if (!video) throw new ApiError(404, "video not found");

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You do not have permission to toggle publish status");
  }

  video.isPublished = !video.isPublished

  await video.save();

  return res.status(200)
    .json(new ApiResponse(200, {}, "Publish status changed"))

});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
