import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    //TODO: create playlist

    if ( [name, description].some((field) => field?.trim() === "")) {
        throw new ApiError(404, "Name and Description both are required");
    }

    const playlist = await Playlist.findOne({ name: name });

    if (playlist) {
        throw new ApiError(404, "Playlist already exists");
    }

    const newPlaylist = await Playlist.create({ 
        name,
        description,
        owner: req.user?.id,
    });

    return res.status(200)
    .json(new ApiResponse(200, newPlaylist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    if (!userId) {
        throw new ApiError(400, "User Id is required");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description:1
            }
        }
    ]);

    if (!playlists) {
        throw new ApiError(404, "User does not have playlist");
    }

    return res.status(200)
    .json(new ApiResponse(200, playlists, "User playlist fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!playlistId) {
        throw new ApiError(400, "Playlist Id is required");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        }
    ]);

    return res.status(200)
    .json(new ApiResponse(200, playlist[0],"Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist Id and Video Id both are required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(400, "Playlist not found");
    }

    if (playlist.videos.includes(video._id)) {
        throw new ApiError(400, "Video already exists in the playlist");
    }

    playlist.videos.push(video._id)
    await playlist.save();

    return res.status(200)
    .json(new ApiResponse(200, playlist, "Video added into playlist successfully"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist Id and Video Id both are required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(200, "Video not found");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(200, "Playlist not found");
    }

    if (!playlist.videos.includes(video._id)) {
        throw new ApiError(200, "Video is not added in this playlist");
    }

    playlist.videos = playlist.videos.filter((vid) => vid.toString() !== video._id.toString());

    await playlist.save();

    return res.status(200)
    .json(new ApiResponse(200, "Video removed from playlist successfully"));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200)
    .json(new ApiResponse(200, "Playlist deleted successfully"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }

    if (!name || !description) {
        throw new ApiError(400, "Name and Description both are required to edit");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name,
            description
        },
        { new: true }
    ); 
    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    console.log(playlist,'playlist');
    return res.status(200)
    .json(new ApiResponse(200, playlist,"Playlist updated successfully"));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
