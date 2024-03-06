import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema({
  video: {
    type: Schema.Types.ObjectId,
    ref: "Video",
    default: null
  },
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
    default: null
  },
  tweet: {
    type: Schema.Types.ObjectId,
    ref: "Tweet",
    default: null
  },
}, { timestamps: true });

export const Like = mongoose.model("Like", likeSchema);