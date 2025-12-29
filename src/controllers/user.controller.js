import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary,deleteAsset } from "../utils/cloudinary.js";
import jwt  from "jsonwebtoken";
import mongoose, { trusted } from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong generating tokens in user controller"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user detail from frontend
  //validation(check username is unique email unique password strong)
  //check avatar , check image
  //upload them to cloudinary
  //create user object-create enrty in db-->return response
  //remove the password and refreshtoken from the response
  //check for user creation
  //return res

  const { fullName, email, userName, password } = req.body;
  console.log(email);

  if (
    [fullName, email, userName, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existedUser)
    throw new ApiError(409, "user with username or email already exists");

  let coverImageLocalPath, avatarLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  if (!avatarLocalPath) throw new ApiError(400, "avatar file is required");
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(400, "avatar file is required");

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new ApiError(500, "something went wrong while registering the user");

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "Registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //username and password from user
  //check in database username if found check password if correct tell login
  const { email, userName, password } = req.body;

  if (!userName && !email) {
    throw new ApiError(400, "Username or email is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (!user) throw new ApiError(404, "user not found");

   const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Password Incorrect");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  //since in fuction user is added with refresh token so we have to update the user
  const loggedInUser = await User
    .findById(user._id)
    .select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        "User loggen in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      // $set: {
      //   refreshToken: undefined,
      // }, can also be don using unset
      $unset:{
        refreshToken:1
      }
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };


  return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out successfully"))

});

const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies .refreshToken||req.body.refreshToken
  if(!incomingRefreshToken)throw new ApiError(401,"unauthorized request")

  try {
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
    const user=await User.findById(decodedToken?._id)
      
    if(!user)throw new ApiError(401,"invalid refresh token")
  
    if(incomingRefreshToken!==user?.refreshToken)throw new ApiError(401,"refresh token expired")
  
  
    
  
    const options={
      httpOnly:true,
      secure:true
    }
  
    const {newAccessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
  
  
    return res
    .status(200)
    .cookie("refreshToken",newRefreshToken,options)
    .cookie("accessToken",newAccessToken,options)
    .json(new ApiResponse(200,
      {accessToken:newAccessToken,refreshToken:newRefreshToken},
      "access token refreshed"
    ))
  } catch (error) {
    throw new ApiError(401,error?.message||"invalid refresh Token")
  }
})



const changeCurrentPassword=asyncHandler(async (req,res)=>{
  const {oldPassword,newPassword}=req.body

  const user=await User.findById(req.user?._id)
  const check=await user.isPasswordCorrect(oldPassword)

  if(!check) throw new ApiError(401,"password is incorrect")

  user.password=newPassword
  await user.save({validateBeforeSave:false})



  return res
  .status(200)
  .json(new ApiResponse(200,{},"Password Changed successfully"))
})


const getCurrentUser=asyncHandler(async (req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails=asyncHandler(async (req,res)=>{
  const {fullName,email}=req.body

  if(!fullName||!email) throw new ApiResponse(400,"All feilds are required")

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email
      }
    },
    {new:true}
  ).select("-password")


  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"))
})


const updateUserAvatar=asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path

  if(!avatarLocalPath) throw new ApiError(400,"avatar file is missing")

  const avatar=await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url) throw new ApiError(400,"error while uploading on avatar")


  const oldUrl=req.user?.avatar;



  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url 
      }
    }
    ,{new:true}
  
  ).select("-password")



  if(oldUrl) await deleteAsset(oldUrl)

  return res
  .status(200)
  .json(new ApiResponse(200,user,"avatar updated successfully"))
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalPath=req.file?.path

  if(!coverImageLocalPath) throw new ApiError(400,"cover Image file is missing")

  const coverImage=await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url) throw new ApiError(400,"error while uploading on cover Image")

  const oldUrl=req.user?.avatar;

  
  
  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url 
      }
    }
    ,{new:true}
  
  ).select("-password")


  if(oldUrl) await deleteAsset(oldUrl)

  return res
  .status(200)
  .json(new ApiResponse(200,user,"cover Image updated successfully"))
})



const getUserChannelProfile=asyncHandler(async (req,res)=>{
  const {userName}=req.params//from the url 
  if(!userName?.trim()) throw new ApiError(400,"username is missing")

  const channel=await User.aggregate([
    {
      $match:{
        userName:userName?.toLowerCase
      }
    },
    {
      $lookup:{
        from:"Subscription",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"Subscription",
        localField:"_id",
        foreignField:"subscriber",
        as:"subcribedTo"
      }
    },
    {
      $addFields:{
        subscriberCount:{
          $size:"$subscribers"
        },
        channelsSubscribedToCount:{
          $size:"$subcribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in :[req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else:false

          }
        }
      },
    },
    {
      $project:{
        fullName:1,
        userName:1,
        subscriberCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1,
      }
    }
  ])

  if(!channel?.length) throw new ApiError(404,"Channel does not exist")

  return res.status(200).json(new ApiResponse(200,channel[0],"User channel fetched successfully"))
})


const getUserWatchHistory=asyncHandler(async (req,res)=>{
  const user= await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup:{
        from:"Video",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[  
          {
            $lookup:{
              from:"User",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    userName:1,
                    avatar:1
                  }
                }   
              ]
            }
          }
        ]
      }
    },
    {
      $addFields:{
        owner:{
          $first:"$owner"
        }
      }
    }
  ])


  return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"Watch histrory fetched successfully"))
})

export { registerUser, loginUser, logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getUserWatchHistory  };
