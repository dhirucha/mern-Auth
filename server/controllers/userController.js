import userModel from "../models/userModel";


export const getuserData = async (req, res) => {
    try {

        const {userId} = req.body;

        const user = await userModel.findById(userId);

        if(!user){
            return res.json({ success: true, message: "user not found"})
        }

        res.json({
            success:true,
            userData: {
                name: user.name,
                isAccountVerified: user.isAccountVerified
            }
        });
        
    } catch (error) {
        res.json({success:false, message: error.message})
    }
}