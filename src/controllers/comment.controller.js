import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

    const commentPipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)//found the comment with this video ids
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }//adding owner to this
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                owner: {
                    _id: 1,
                    userName: 1,
                    avatar: 1
                }
            }
        }
    ]

    const agg = Comment.aggregate(commentPipeline)

    const comments = await Comment.aggregatePaginate(agg, {
        page: Number(page),
        limit: Number(limit)
    })

    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body//check if the comment  is empty in frontend
    const { videoId } = req.params//video found

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
    //find the user req.user.userName->find the username
    const owner = req.user?._id
    if (!owner) throw new ApiError(401, "Please login to comment")

    if (!content?.trim()) throw new ApiError(400, "Comment cant be empty")

    const addedComment = await Comment.create(
        {
            content,
            video: videoId,
            owner
        }
    )

    return res.status(201).json(new ApiResponse(201, addedComment, "Comment added successfully"))


})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    //check if the user is same as owner take content then get comment by id and update
    const { content } = req.body
    //we will get comment id
    const { commentId } = req.params
    //from here you can get id of owner

    if (!content?.trim()) throw new ApiError(400, "Comment cant be empty")

    const comment = await Comment.findById(commentId)

    if (!comment) throw new ApiError(404, "Comment not found");

    if (comment.owner.toString() !== req.user?._id.toString()) throw new ApiError(403, "You can only update your own comments");



    // const newComment=await Comment.findByIdAndUpdate(commentId,{
    //     $set:{
    //         content
    //     }
    // },{new:true})
    //saving one db call
    comment.content = content;

    await comment.save()

    return res.status(200).json(new ApiResponse(200, comment, "comment updated!!"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params

    const comment = await Comment.findById(commentId)

    if (!comment) throw new ApiError(404, "Comment not found");

    if (comment.owner.toString() !== req.user?._id.toString()) throw new ApiError(403, "You can only Delete your own comments");


    // const deleted = await Comment.findByIdAndDelete(commentId);
    // if (!deleted) {
    //     throw new Error("Comment not found");
    // }

    //since already fetched the comment

    await comment.deleteOne()


    res.status(200).json(new ApiResponse(200, {}, "Deleted Successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}