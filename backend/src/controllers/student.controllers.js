import { Student } from "../models/student.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponses.js";

const generateAccessAndRefreshTokens = async (studentId) => {
    try {
        const student = await Student.findById(studentId);
        if (!student) {
            throw new ApiError(404, "Student not found");
        }

        const accessToken = student.generateAccessToken();
        const refreshToken = student.generateRefreshToken();

        student.refreshToken = refreshToken;
        await student.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Token generation error:", error);
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
};

const registerStudent = asyncHandler( async(req, res) => {

    // get srudent details from frontend
    const { fullName, mobile, class_No, password, guardianName, guardianMobile } = req.body

    // validation - not empty
    if(
        [fullName, mobile, class_No, guardianName, password, guardianMobile].some((field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }
    
    // check is student already exists: by mobile
    const existedStudent = await Student.findOne({ mobile });

    if(existedStudent){
        throw new ApiError(409, "Student with mobile no. already exists")
    }
    
    let verified;

    // create student object - create entry in db
    const student = await Student.create(
        {
        fullName,
        mobile,
        class_No,
        password,
        guardianName,
        guardianMobile,
        verified: false
        }
    )

    // remove password and refresh token field from response
    const createdStudent = await Student.findById(student._id).select(
        "-password -refreshToken"
    )

    if(!createdStudent){
        throw new ApiError(500, "Something went wrong while registering the student")
    }

    return res.status(201).json(
        new ApiResponse(200, createdStudent, "Student registered Successfully")
    )

})

const loginStudent = asyncHandler( async(req, res) => {
    
    // get frontend data from req.body
    const {mobile, password} = req.body

    if(!mobile){
        throw new ApiError(400, "Mobile no. is required")
    }

    // find student by mobile
    const student = await Student.findOne({ mobile });

    if(!student){
        throw new ApiError(404, "Student does not exist")
    }

    const isPasswordValid = await student.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid student credentials!")
    }

    // generate access token & refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(student._id)

    // if DB call is expensive operation --> Update object, or call DB

    const loggedInStudent = await Student.findById(student._id).select("-password -refreshToken")

    // frontend can't modify, only server could edit
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,{
                user: loggedInStudent, accessToken, refreshToken
            },
            "Student logged in Successfully"
        )
    )

})

const logoutStudent = asyncHandler( async(req, res) => {
    await Student.findByIdAndUpdate(
        req.student._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Student logged out"))
})

export {
    registerStudent,
    loginStudent,
    logoutStudent
};