import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const studentSchema = new Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Full Name is required'],
            trim: true,
            index: true
        },
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            unique: true,       // No duplicate mobile numbers allowed
            trim: true,         // Removes leading/trailing spaces
            index: true,        // Speeds up search queries
            validate: {
                validator: function(v) {
                return /^[6-9]\d{9}$/.test(v); // Validates Indian mobile numbers (10 digits starting with 6–9)
                },
                message: props => `${props.value} is not a valid mobile number!`
            }
        },
        class_No: {
            type: Number,
            enum: [11, 12],
            required: [true, 'Class is required']
        },
        guardianName: {
            type: String,
            // required: true,
            trim: true,
            index: true
        },
        guardianMobile: {
            type: String,
            required: [true, 'Guardian mobile number is required'],
            unique: true,       // No duplicate mobile numbers allowed
            trim: true,         // Removes leading/trailing spaces
            index: true,        // Speeds up search queries
            validate: {
                validator: function(v) {
                return /^[6-9]\d{9}$/.test(v); // Validates Indian mobile numbers (10 digits starting with 6–9)
                },
                message: props => `${props.value} is not a valid mobile number!`
            }
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters long'],
        },
        refreshToken: {
            type: String
        } 
    },
    {
        timestamps: true
    }
);


// Hash password before saving
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance method to compare password
studentSchema.methods.isPasswordCorrect = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

studentSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            mobile: this.mobile,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
studentSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const Student = mongoose.model("Student", studentSchema);