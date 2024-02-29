import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshTokens = async(userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
      throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
};

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
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

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

const loginUser = asyncHandler( async (req, res) => {
  //req body > Data
  //username or email
  //find the user
  //password check
  //access and refresh token
  //send cookie and response

  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "Username or Email is required");
  }

  const user = await User.findOne({ 
    $or: [{username}, {email}]
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  var isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password Incorrect");
  }

  var { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(new ApiResponse(200, 
    {
      user: loggedInUser, 
      accessToken, 
      refreshToken,
    },
    "User Logged In Successfully"
  ));
});

const logoutUser =  asyncHandler( async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      }
    },
    {
      new: true
    }
  );

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler( async(req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?.id);
  
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
  
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refresh", refreshToken, options)
    .json(new ApiResponse(200, 
      {
        accessToken, 
        refreshToken,
      },
      "Access Token refreshed successfully"
    ));
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };