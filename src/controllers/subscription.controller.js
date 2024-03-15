import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    if (!channelId) {
        throw new ApiError(400, "Channel Id required");
    }

    const channel = await User.findById(channelId);

    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    let subscription = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channel?._id)
            }
        },
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(req.user?._id)
            }
        }
    ]);

    if (subscription.length === 0) {
        subscription = await Subscription.create({
            channel: channel?._id,
            subscriber: req.user?._id
        });
        return res.status(200)
        .json(new ApiResponse(200, subscription, "Channel subscribed successfully"));
    } else {
        subscription = await Subscription.findByIdAndDelete(subscription[0]?._id);
        console.log(subscription, 'unsubscribed');
        return res.status(200)
        .json(new ApiResponse(200, subscription, "Channel unsubscribed successfully"));
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId) {
        throw new ApiError(404, "Subscriber is required");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $addFields: {
                subscriber: {
                    $first: "$subscriber"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscriber._id"] },
                        then: true,
                        else: false,
                    },
                }
            }
        },
        {
            $project: {
                "subscriber.avatar": 1,
                "subscriber.fullname": 1,
                "subscriber.username": 1,
                "subscriber._id": 1,
                isSubscribed: 1
            },
        }
    ]);
    
    res.status(200)
    .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId) {
        throw new ApiError(404, "Subscriber Id is required");
    }
    
    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel"
            }
        },
        {
            $addFields: {
                channel: {
                    $first: "$channel"
                }
            }
        },
        {
            $project: {
                "channel.username" : 1,
                "channel.email" : 1,
                "channel.fullname" : 1,
                "channel.avatar" : 1,
            }
        }
    ]);

    return res.status(200)
    .json(new ApiResponse(200, channels, "Channels fetched successfully"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}