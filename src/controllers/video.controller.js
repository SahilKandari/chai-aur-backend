import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    if (!userId) {
        userId = req.user?._id;
    }
    // const skip =  (parseInt(page) - 1) * limit;
    
    // const videos = await Video.aggregate([
    //     // {
    //     //     $match: {
    //     //         owner: new mongoose.Types.ObjectId(userId),
    //     //     }
    //     // },
    //     {
    //         $sort: {
    //             createdAt: sortType === 'asc' ? 1 : -1
    //         }
    //     },
    //     {
    //         $skip: skip
    //     },
    //     {
    //         $limit: parseInt(limit)
    //     },
    //     {
    //         $lookup: {
    //             from: "users",
    //             localField: "owner",
    //             foreignField: "_id",
    //             as: "owner"
    //         }
    //     },
    //     {
    //         $addFields: {
    //             owner: {
    //                 $first: "$owner"
    //             }
    //         }
    //     },
    //     {
    //         $project: {
    //             thumbnail: 1,
    //             title: 1,
    //             duration: 1,
    //             views: 1,
    //             createdAt: 1,
    //             "owner.username": 1,
    //             "owner.avatar": 1,
    //         }
    //     }
    // ]);
    
    const matchStage = {
        $match: {
            // owner: new mongoose.Types.ObjectId(userId)
        }
    };

    if (query) {
        matchStage.$match.$text = { $search: query }; 
    }

    const sortStage = {
        $sort: {}
    };

    if (sortBy && sortType) {
        sortStage.$sort[sortBy] = sortType === 'asc' ? 1 : -1;
    } else {
        sortStage.$sort['createdAt'] = 1; 
    }

    const skip = (parseInt(page) - 1) * limit;

    const paginationStage = {
        $skip: skip
    };

    const pipeline = [
        matchStage,
        sortStage,
        paginationStage,
        { $limit: parseInt(limit) },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                thumbnail: 1,
                title: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                description: 1,
                "owner.username": 1,
                "owner.avatar": 1,
            }
        }
    ];

    const videos = await Video.aggregate(pipeline);

    return res.status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"))
});

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description } = req.body;

    if (!title) {
        throw new ApiError(400, "Enter Title of the video");
    }

    const videoLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video File is required");
    }

    console.log('Uploading Video...');

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    
    if (!videoFile) {
        throw new ApiError(400, "Error while uploading video");
    }
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

    // const user = await User.findById(req.user?._id).select("-password -refreshToken -watchHistory");
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnailFile.url,
        title,
        description,
        duration: videoFile.duration,
        owner : req.user?._id
    });

    return res.status(200)
    .json(new ApiResponse(200, { 
        url: video.videoFile,
        title: video.title,
        duration: video.duration
    }, "Video added successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video Id is required");
    }

    // const video = await Video.findById(videoId);

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                createdAt: 1,
                description: 1,
                thumbnail: 1,
                title: 1,
                videoFile: 1,
                views: 1,
                viewedBy: 1,
                "owner.username": 1,
                "owner.avatar": 1,
                "owner._id": 1,
            }
        }
    ]);

    if (!video) {
        throw new ApiError(404, "Video not available");
    }

    const { _id } = req.user;

    const viewedByStrings = video[0].viewedBy.map(viewerId => viewerId.toString());

    if (video[0].owner._id.toString() !== _id && !viewedByStrings.includes(_id.toString())) {
        await Video.findByIdAndUpdate(videoId, {
            $inc: { views: 1 },
            $addToSet: { viewedBy: _id }
        });
    }

    res.status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"))
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body;
    //TODO: update video details like title, description, thumbnail

    if (!videoId) {
        throw new ApiError(400, "Video Id is required");
    }

    var thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath && !title && !description) {
        throw new ApiError(404, "Need at least one of the three Thumbnail, Title or Description to update the video details");

    }
    let updateObject = {};
    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        updateObject.thumbnail = thumbnail.url;
    }

    if (title) {
        updateObject.title = title;
    }

    if (description) {
        updateObject.description = description;
    }

    const video = await Video.findByIdAndUpdate(videoId, {
        $set: updateObject
    }, { new: true });

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId) {
        throw new ApiError(200, "Video Id is required");
    }
    
    const video = await Video.findByIdAndDelete(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200)
    .json(new ApiResponse(200, video, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(404, "Video Id is required");
    }

    let { isPublished } = req.body;

    if (!isPublished) {
        throw new ApiError(404, "Publish is required");
    }

    isPublished = JSON.parse(isPublished);

    const video = await Video.findByIdAndUpdate(videoId,{
        $set: {
            isPublished: isPublished
        }
    }, { new: true });

    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    res.status(200)
    .json(new ApiResponse(200, video, `Status to publish the video is updated: ${isPublished}`))
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
