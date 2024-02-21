import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js'

const registerUser = asyncHandler( async (req, res) => {
  // get user details from fron-end
  // validate the user details
  // check if the user already exists
  // check for images and avatar
  // upload them into cloudinary
  // create user object, create entry in db
  // remove password and refresh token from response
  // check the user creation
  // return res

  const { username, email, fullname, password } = req.body;
  console.log(username, email, fullname, password, 'Working register user');

  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Field Missing")
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log(avatar, 'avatar');
  console.log(coverImage, 'coverImage');
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    username,
    email,
    fullname,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser =  await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(200).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  );
  // res.status(200).json({
  //   message: 'ok',
  // });
});

export { registerUser };