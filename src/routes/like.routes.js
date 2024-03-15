import { Router } from 'express';
import {
    getLikedVideos,
    getDisikedVideos,
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    toggleVideoDislike,
    getVideoLike,
    getVideoDislike
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/v/:videoId/dislike").post(toggleVideoDislike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);
router.route("/videos/dislikes").get(getDisikedVideos);
router.route("/v/:videoId").get(getVideoLike);
router.route("/v/:videoId/dislike").get(getVideoDislike);

export default router