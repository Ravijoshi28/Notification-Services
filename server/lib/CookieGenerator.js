import JWT from "jsonwebtoken"

export async function AccessToken(user){

    return JWT.sign({username:user.username,email:user.email,id:user.id},
        process.env.JWT_SECRET,
        {expiresIn:"30m"}
    )
}

export async function RefreshToken(user){

    return JWT.sign({username:user.username,email:user.email,id:user.id},
        process.env.JWT_SECRET,
        {expiresIn:"7d"}
    )
}