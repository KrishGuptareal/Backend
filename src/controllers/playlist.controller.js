import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    //TODO: create playlist

    if (!name || !description)
        throw new ApiError(400, "name and description are required");

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    //TODO: get user playlists

    if (!isValidObjectId(userId)) throw new ApiError(400, "Playlist not found");

    const playlists = await Playlist.find({ owner: userId }).select(
        "name description id"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlists, "User playlist fetched successfully")
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    //TODO: get playlist by id
    //in this we have to lookup video section also

    if (!isValidObjectId(playlistId))
        throw new ApiError(400, "invalid playlist id");

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId),
            },
        },
        {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "videos",
                as: "videos",
            },
        },
    ]);

    if (!playlist.length) throw new ApiError(404, "Playlist not found");
    return res
        .status(200)
        .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId))
        throw new ApiError(400, "Invalid playlist id");
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId");

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Only owner can add videos to this playlist");
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { _id: playlistId, videos: { $ne: videoId } },
        {
            $addToSet: { videos: videoId },
        },
        { new: true }
    );

    if (!updatedPlaylist)
        throw new ApiError(404, "Video already in playlist");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "video added to the playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId))
        throw new ApiError(400, "Invalid playlist id");
    if (!isValidObjectId(videoId))
        throw new ApiError(400, "Invalid videoId");

    const playlistCheck = await Playlist.findById(playlistId);
    if (!playlistCheck) throw new ApiError(404, "Playlist not found");

    if (playlistCheck.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Only owner can remove videos from this playlist");
    }

    const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, videos: videoId },
        {
            $pull: { videos: videoId },
        },
        { new: true }
    );

    if (!playlist) throw new ApiError(404, "Video not in playlist")
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video deleted successfully"))

});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!isValidObjectId(playlistId))
        throw new ApiError(400, "playlist doesnot exist");

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Only owner can delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist
    if (!isValidObjectId(playlistId))
        throw new ApiError(400, "playlist doesnot exist");

    if (!name || !description)
        throw new ApiError(400, "name and description are required");

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Only owner can update this playlist");
    }

    const result = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name,
            description,
        },
        { new: true }
    );

    if (!result) throw new ApiError(400, "Playlist not found");

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Playlist updated successfully"));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
