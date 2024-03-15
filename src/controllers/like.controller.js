import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const like = await Like.findOne({
        video: video._id,
        likedBy: req.user._id
    });
    
    if (like) {
        if (like.isLike) {
            await Like.findByIdAndDelete(like._id);

            return res.status(200)
            .json(new ApiResponse(200, "Video Like removed successfully")); 
        } else {
            const editedLike = await Like.findByIdAndUpdate(like._id, 
                {
                    isLike: true
                }, { new: true }
            )
            return res.status(200)
            .json(new ApiResponse(200, editedLike, "Video Like added successfully")); 
        }
    } else {
        const createdLike = await Like.create({
            video: video._id,
            likedBy: req.user._id,
        });

        return res.status(200)
        .json(new ApiResponse(200, createdLike, "Video Like added successfully"));
    }
});

const toggleVideoDislike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const like = await Like.findOne({
        video: video._id,
        likedBy: req.user._id
    });


    if (like) {
        if (like?.isLike) {
            const editedLike = await Like.findByIdAndUpdate(like._id, 
                {
                    isLike: false
                }, { new: true }
            )
    
            return res.status(200)
            .json(new ApiResponse(200, editedLike, "Video Dislike added successfully"));
        } else {
            await Like.findByIdAndDelete(like._id);

            return res.status(200)
            .json(new ApiResponse(200, "Video Dislike removed successfully")); 
        } 
    } else {
        const createdDislike = await Like.create({
            video: video._id,
            likedBy: req.user._id,
            isLike: false
        });

        return res.status(200)
        .json(new ApiResponse(200, createdDislike, "Video Dislike added successfully"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(200, "Comment not found");
    }

    const like = await Like.findOne({
        comment: comment._id,
        likedBy: req.user._id
    });

    if (like) {
        await Like.findByIdAndDelete(like._id);

        return res.status(200)
        .json(new ApiResponse(200, "Comment Like removed successfully"));
    } else {
        const createdLike = await Like.create({
            comment: comment._id,
            likedBy: req.user._id
        });

        return res.status(200)
        .json(new ApiResponse(200, createdLike, "Comment Like added successfully"));
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    
    if (!tweetId) {
        throw new ApiError(200, "Tweet ID is required");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    const like = await Like.findOne({
        tweet: tweet._id,
        likedBy: req.user._id
    });

    if (like) {
        await Like.findByIdAndDelete(like._id);

        return res.status(200)
        .json(new ApiResponse(200, "Tweet Like removed successfully"));
    } else {
        const createdLike = await Like.create({
            tweet: tweet._id,
            likedBy: req.user._id
        });

        return res.status(200)
        .json(new ApiResponse(200, createdLike, "Tweet Like added successfully"));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const like = await Like.aggregate([
        {
            $match: {
                likedBy: req.user._id,
                isLike: true
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "liked_videos"
            }
        },
        {
            $unwind: "$liked_videos"
        },
        {
            $lookup: {
                from: "users",
                localField: "liked_videos.owner",
                foreignField: "_id",
                as: "liked_videos.owner"
            }
        },
        {
            $addFields: {
                "liked_videos.owner": { $arrayElemAt: ["$liked_videos.owner", 0] }
            }
        },
        {
            $group: {
                _id: null,
                liked_videos: { $push: "$liked_videos" }
            }
        },
        {
            $project: {
                _id: 0,
                liked_videos: {
                    $map: {
                        input: "$liked_videos",
                        as: "video",
                        in: {
                            _id: "$$video._id",
                            thumbnail: "$$video.thumbnail",
                            title: "$$video.title",
                            views: "$$video.views",
                            owner: "$$video.owner.username"
                        }
                    }
                }
            }
        }
    ]);
    return res.status(200)
    .json(new ApiResponse(200 , like[0]?.liked_videos, "Liked Videos fetched successfully"));
});

const getDisikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const like = await Like.aggregate([
        {
            $match: {
                likedBy: req.user._id,
                isLike: false
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "liked_videos"
            }
        },
        {
            $unwind: "$liked_videos"
        },
        {
            $lookup: {
                from: "users",
                localField: "liked_videos.owner",
                foreignField: "_id",
                as: "liked_videos.owner"
            }
        },
        {
            $addFields: {
                "liked_videos.owner": { $arrayElemAt: ["$liked_videos.owner", 0] }
            }
        },
        {
            $group: {
                _id: null,
                liked_videos: { $push: "$liked_videos" }
            }
        },
        {
            $project: {
                _id: 0,
                liked_videos: {
                    $map: {
                        input: "$liked_videos",
                        as: "video",
                        in: {
                            _id: "$$video._id",
                            thumbnail: "$$video.thumbnail",
                            title: "$$video.title",
                            views: "$$video.views",
                            owner: "$$video.owner.username"
                        }
                    }
                }
            }
        }
    ]);
    return res.status(200)
    .json(new ApiResponse(200 , like[0]?.liked_videos, "Liked Videos fetched successfully"));
});

const getVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }


    const videoLike = await Like.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
                isLike: true
            }
        }
    ]);

    res.status(200)
    .json(new ApiResponse(200, videoLike, "Video Like fetched successfully"));
});

const getVideoDislike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }


    const videoLike = await Like.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
                isLike: false
            }
        }
    ]);

    res.status(200)
    .json(new ApiResponse(200, videoLike, "Video Dislike fetched successfully"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    toggleVideoDislike,
    getLikedVideos,
    getDisikedVideos,
    getVideoLike,
    getVideoDislike
}